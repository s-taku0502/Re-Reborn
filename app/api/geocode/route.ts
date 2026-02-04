import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
                headers: {
                    'Accept-Language': 'ja',
                    'User-Agent': 'michikusa_memory_app/1.0',
                },
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[Geocode API] Nominatim returned ${response.status}`);
            // フォールバックデータを返す
            return NextResponse.json({
                address: {
                    country_code: 'jp',
                    country: 'Japan',
                },
            });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Geocode API] Error:', error);
        // エラー時はフォールバックデータを返す
        return NextResponse.json({
            address: {
                country_code: 'jp',
                country: 'Japan',
            },
        });
    }
}
