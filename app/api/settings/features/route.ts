import { NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/admin-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const features = await getFeatureFlags();
        return NextResponse.json({ success: true, features });
    } catch (error) {
        console.error('[Public Settings API] Feature flags error:', error);
        return NextResponse.json(
            { success: false, error: '設定の取得に失敗しました' },
            { status: 500 }
        );
    }
}
