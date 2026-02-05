import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import { getAdminDb } from '@/lib/admin-firestore';

/**
 * GET /api/admin/dashboard/stats
 * ダッシュボードの統計情報を取得
 */
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

        const db = getAdminDb();

        // 総ユーザー数
        const usersSnapshot = await db.collection('users').count().get();
        const totalUsers = usersSnapshot.data().count;

        // 総ログ数
        const logsSnapshot = await db.collection('logs').count().get();
        const totalLogs = logsSnapshot.data().count;

        // 総お問い合わせ数
        const contactsSnapshot = await db.collection('contacts').count().get();
        const totalContacts = contactsSnapshot.data().count;

        // 対応待ちお問い合わせ数
        const pendingContactsSnapshot = await db
            .collection('contacts')
            .where('status', '==', 'pending')
            .count()
            .get();
        const pendingContacts = pendingContactsSnapshot.data().count;

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                totalLogs,
                totalContacts,
                pendingContacts,
            },
        });
    } catch (error) {
        console.error('[Admin Dashboard Stats API] error:', error);
        return NextResponse.json(
            { success: false, error: '統計情報の取得に失敗しました' },
            { status: 500 }
        );
    }
}
