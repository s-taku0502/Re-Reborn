import { NextResponse } from 'next/server';
import { getMaintenanceMode } from '@/lib/admin-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const maintenance = await getMaintenanceMode();
        return NextResponse.json({ success: true, maintenance });
    } catch (error) {
        console.error('[Public Maintenance API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'メンテナンス状態の取得に失敗しました' },
            { status: 500 }
        );
    }
}
