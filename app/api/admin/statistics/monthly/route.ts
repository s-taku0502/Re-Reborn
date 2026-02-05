/**
 * 月次統計API
 * GET /api/admin/statistics/monthly - 月次統計を取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import { getMonthlyStats, getMonthlyStatsRange } from '@/lib/admin-statistics';

/**
 * GET /api/admin/statistics/monthly
 * 月次統計を取得（管理者・スーパー管理者のみ）
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

        // モデレーターはアクセス不可
        if (admin.role === 'moderator') {
            return NextResponse.json(
                { success: false, error: 'アクセス権限がありません' },
                { status: 403 }
            );
        }

        // クエリパラメータ
        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month'); // YYYY-MM形式
        const months = parseInt(searchParams.get('months') || '12');

        if (month && /^\d{4}-\d{2}$/.test(month)) {
            // 指定月の統計
            const [year, monthStr] = month.split('-');
            const stat = await getMonthlyStats(parseInt(year), parseInt(monthStr));
            return NextResponse.json({
                success: true,
                stat,
            });
        } else {
            // 直近N月間の統計
            const stats = await getMonthlyStatsRange(Math.min(months, 24)); // 最大24ヶ月
            return NextResponse.json({
                success: true,
                stats,
                months: Math.min(months, 24),
            });
        }
    } catch (error) {
        console.error('[Admin Statistics Monthly API] error:', error);
        return NextResponse.json(
            { success: false, error: '月次統計の取得に失敗しました' },
            { status: 500 }
        );
    }
}
