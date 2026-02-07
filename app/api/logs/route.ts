/**
 * 一般ユーザー向けログ表示・管理API
 * GET /api/logs - ユーザーのログ一覧取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogsFromFirestore } from '@/lib/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // クエリパラメータから userId を取得
        const userId = req.nextUrl.searchParams.get('userId');

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json(
                { ok: false, code: 'INVALID_INPUT', message: 'userIdが必要です' },
                { status: 400 }
            );
        }

        // ログを取得（管理者向けのフラグを含む）
        const logs = await getLogsFromFirestore(userId);

        return NextResponse.json({
            ok: true,
            logs: logs.map(log => ({
                ...log,
                // 管理者フラグは含めない（一般ユーザーには非表示）
                imageFlagged: undefined,
                imageFlagReasons: undefined,
            })),
        });
    } catch (error) {
        console.error('[Logs API] Error:', error);
        return NextResponse.json(
            { ok: false, code: 'SERVER_ERROR', message: 'ログの取得に失敗しました' },
            { status: 500 }
        );
    }
}
