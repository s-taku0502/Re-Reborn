/**
 * 管理者向けログモデレーション・監視API
 * GET /api/admin/logs - フラグ付きログ一覧（管理者のみ）
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import { getAdminDb } from '@/lib/admin-firestore';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // 認証チェック
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: '認証が必要です' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(authHeader.replace('Bearer ', ''));
        if (!decoded) {
            return NextResponse.json(
                { success: false, error: '無効なトークンです' },
                { status: 401 }
            );
        }

        // 管理者存在チェック
        const admin = await findAdminById(decoded.adminId);
        if (!admin || !admin.isActive) {
            return NextResponse.json(
                { success: false, error: '管理者が見つかりません' },
                { status: 404 }
            );
        }

        // クエリパラメータ
        const flaggedOnly = req.nextUrl.searchParams.get('flaggedOnly') === 'true';
        const reviewedFilter = req.nextUrl.searchParams.get('reviewed') || 'unreviewed'; // 'all', 'unreviewed', 'reviewed'
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
        const page = parseInt(req.nextUrl.searchParams.get('page') || '0', 10);

        const db = getAdminDb();

        // 全ユーザーを取得
        const usersSnapshot = await db.collection('users').get();
        let allLogs: any[] = [];

        // 各ユーザーのログを取得
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            let logsQuery: any = db.collection('users').doc(userId).collection('logs');

            // フラグ付きのみフィルタ
            if (flaggedOnly) {
                logsQuery = logsQuery.where('imageFlagged', '==', true);
            }

            let logsSnapshot;
            try {
                logsSnapshot = await logsQuery.get();
            } catch (queryError) {
                console.warn(`[Admin Logs] Warning for user ${userId}:`, queryError);
                continue;
            }

            logsSnapshot.forEach((doc: QueryDocumentSnapshot) => {
                const data = doc.data();
                allLogs.push({
                    logId: doc.id,
                    userId: userId,
                    ...data,
                    createdAt: data.createdAt instanceof Object
                        ? data.createdAt.toDate?.().toISOString() || data.createdAt.toString()
                        : data.createdAt,
                });
            });
        }

        // reviewed フィルタでメモリ内フィルタリング
        let filteredLogs = allLogs;
        if (reviewedFilter === 'unreviewed') {
            filteredLogs = allLogs.filter(log => !log.reviewed);
        } else if (reviewedFilter === 'reviewed') {
            filteredLogs = allLogs.filter(log => log.reviewed === true);
        }
        // 'all' の場合はフィルタなし

        // 全体でソート（最新順）
        filteredLogs.sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime;
        });

        const total = filteredLogs.length;
        const offset = page * limit;
        const logs = filteredLogs.slice(offset, offset + limit);
        const pageCount = Math.ceil(total / limit);

        console.log('[Admin Logs API] GET response:', {
            totalLogs: filteredLogs.length,
            returnedLogs: logs.length,
            sampleLog: logs[0] || null,
            reviewedFilter,
        });

        return NextResponse.json({
            success: true,
            logs,
            total,
            limit,
            page,
            pageCount,
        });
    } catch (error) {
        console.error('[Admin Logs API] GET error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { success: false, error: 'ログの取得に失敗しました', details: errorMsg },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/logs - ログの確認状態を更新
 */
export async function PUT(req: NextRequest) {
    try {
        console.log('[Admin Logs API] PUT request received');

        // 認証チェック
        const authHeader = req.headers.get('authorization');
        console.log('[Admin Logs API] Auth header present:', !!authHeader);

        if (!authHeader) {
            console.error('[Admin Logs API] No authorization header');
            return NextResponse.json(
                { success: false, error: '認証が必要です' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        console.log('[Admin Logs API] Token valid:', !!decoded);

        if (!decoded) {
            console.error('[Admin Logs API] Invalid token');
            return NextResponse.json(
                { success: false, error: '無効なトークンです' },
                { status: 401 }
            );
        }

        // 管理者存在チェック
        const admin = await findAdminById(decoded.adminId);
        console.log('[Admin Logs API] Admin found:', !!admin, 'Active:', admin?.isActive);

        if (!admin || !admin.isActive) {
            console.error('[Admin Logs API] Admin not found or inactive');
            return NextResponse.json(
                { success: false, error: '管理者が見つかりません' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { userId, logId, reviewed } = body;

        console.log('[Admin Logs API] Request body:', { userId, logId, reviewed });

        if (!userId || !logId) {
            console.error('[Admin Logs API] Missing userId or logId');
            return NextResponse.json(
                { success: false, error: 'userId と logId は必須です' },
                { status: 400 }
            );
        }

        const db = getAdminDb();

        // ドキュメントの存在確認
        const logRef = db.collection('users').doc(userId).collection('logs').doc(logId);
        const logDoc = await logRef.get();

        console.log('[Admin Logs API] Log document exists:', logDoc.exists);

        if (!logDoc.exists) {
            console.error('[Admin Logs API] Log not found:', { userId, logId });

            // デバッグ: ユーザーのログ一覧を確認
            try {
                const userLogsRef = db.collection('users').doc(userId).collection('logs');
                const allLogsSnapshot = await userLogsRef.get();
                console.error('[Admin Logs API] Available logs for user:', {
                    userId,
                    count: allLogsSnapshot.size,
                    logIds: allLogsSnapshot.docs.map(d => d.id),
                });
            } catch (debugErr) {
                console.error('[Admin Logs API] Debug query failed:', debugErr);
            }

            return NextResponse.json(
                { success: false, error: 'ログが見つかりません', debugInfo: { userId, logId } },
                { status: 404 }
            );
        }

        // set with merge を使用（既存フィールドを保持しつつ reviewed を更新）
        console.log('[Admin Logs API] About to update:', {
            path: `users/${userId}/logs/${logId}`,
            updateData: { reviewed: reviewed === true },
        });

        await logRef.set({
            reviewed: reviewed === true,
        }, { merge: true });

        // 更新後の確認
        const updatedDoc = await logRef.get();
        console.log('[Admin Logs API] Update successful:', {
            path: `users/${userId}/logs/${logId}`,
            updatedData: updatedDoc.data(),
        });

        return NextResponse.json({
            success: true,
            message: 'ログの確認状態を更新しました',
        });
    } catch (error) {
        console.error('[Admin Logs API] PUT error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { success: false, error: 'ログの更新に失敗しました', details: errorMsg },
            { status: 500 }
        );
    }
}
