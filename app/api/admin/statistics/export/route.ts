/**
 * 統計CSVエクスポートAPI
 * GET /api/admin/statistics/export - 統計をCSV形式でエクスポート
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import {
    getDailyStatsRange,
    getMonthlyStatsRange,
    generateDailyStatsCSV,
    generateMonthlyStatsCSV,
} from '@/lib/admin-statistics';

/**
 * GET /api/admin/statistics/export
 * 統計をCSV形式でエクスポート（管理者・スーパー管理者のみ）
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
                { success: false, error: '無              効なトークンです' },
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
        const type = searchParams.get('type') || 'monthly'; // daily or monthly
        const limit = Math.min(parseInt(searchParams.get('limit') || '12'), type === 'daily' ? 90 : 24);

        let csvContent: string;
        let filename: string;

        if (type === 'daily') {
            const stats = await getDailyStatsRange(limit);
            csvContent = generateDailyStatsCSV(stats);
            filename = `daily-stats-${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            const stats = await getMonthlyStatsRange(limit);
            csvContent = generateMonthlyStatsCSV(stats);
            filename = `monthly-stats-${new Date().toISOString().split('T')[0]}.csv`;
        }

        // CSVを返す
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            },
        });
    } catch (error) {
        console.error('[Admin Statistics Export API] error:', error);
        return NextResponse.json(
            { success: false, error: '統計のエクスポートに失敗しました' },
            { status: 500 }
        );
    }
}
