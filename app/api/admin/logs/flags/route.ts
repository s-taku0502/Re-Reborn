import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById, getAdminDb } from '@/lib/admin-firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
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

        const admin = await findAdminById(decoded.adminId);
        if (!admin || !admin.isActive) {
            return NextResponse.json(
                { success: false, error: '管理者が見つかりません' },
                { status: 404 }
            );
        }

        if (admin.role === 'moderator') {
            return NextResponse.json(
                { success: false, error: 'アクセス権限がありません' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const limitParam = Number(searchParams.get('limit') || 50);
        const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

        const db = getAdminDb();
        const snapshot = await db
            .collectionGroup('logs')
            .where('imageFlagged', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const logs = snapshot.docs.map((doc) => ({
            logId: doc.id,
            ...(doc.data() as Record<string, unknown>),
        }));

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('[Admin Logs Flags API] GET error:', error);
        return NextResponse.json(
            { success: false, error: 'フラグ付きログの取得に失敗しました' },
            { status: 500 }
        );
    }
}
