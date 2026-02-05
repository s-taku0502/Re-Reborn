/**
 * 日次統計API
 * GET /api/admin/statistics/daily - 日次統計を取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import { getDailyStats, getDailyStatsRange } from '@/lib/admin-statistics';

/**
 * GET /api/admin/statistics/daily
 * 日次統計を取得（管理者・スーパー管理者のみ）
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
        const date = searchParams.get('date'); // YYYY-MM-DD形式
        const days = parseInt(searchParams.get('days') || '30');

        if (date) {
            // 指定日付の統計
            const stat = await getDailyStats(new Date(date));
            return NextResponse.json({
                success: true,
                stat,
            });
        } else {
            // 直近N日間の統計
            const stats = await getDailyStatsRange(Math.min(days, 90)); // 最大90日
            return NextResponse.json({
                success: true,
                stats,
                days: Math.min(days, 90),
            });
        }
    } catch (error) {
        console.error('[Admin Statistics Daily API] error:', error);
        return NextResponse.json(
            { success: false, error: '日次統計の取得に失敗しました' },
            { status: 500 }
        );
    }
}
