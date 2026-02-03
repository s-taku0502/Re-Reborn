/**
 * 位置情報とタイムゾーン情報を取得するユーティリティ
 * Nominatim (Open Street Map) + WorldTimeAPI を使用
 */

export interface GeoLocation {
    latitude: number;
    longitude: number;
    countryCode: string;
    countryName: string;
    region?: string;
    timezone?: string;
    localDateTime?: Date;
    brightness: 'dark' | 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * ブラウザから位置情報を取得
 */
export function getUserLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
                timeout: 10000,
                enableHighAccuracy: false,
            }
        );
    });
}

/**
 * WorldTimeAPI でタイムゾーン情報を取得
 */
async function getTimezoneFromCoordinates(
    latitude: number,
    longitude: number
): Promise<{ timezone: string; localDateTime: Date } | null> {
    try {
        const response = await fetch(
            `https://worldtimeapi.org/api/timezone`,
            {
                headers: {
                    'User-Agent': 'michikusa_memory_app',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`WorldTimeAPI error: ${response.status}`);
        }

        const timezones = await response.json();

        // 簡易的なタイムゾーン推定（緯度経度から）
        // より正確には GeoNames API を使用すべきだが、ここでは UTC+9（日本）をデフォルトに
        let timezone = 'Asia/Tokyo';

        // 経度からおおよそのタイムゾーンを推定
        const estimatedOffset = Math.round(longitude / 15);
        if (estimatedOffset >= -12 && estimatedOffset <= 12) {
            const offsetHours = estimatedOffset > 0 ? `+${estimatedOffset}` : estimatedOffset;
            // UTCオフセットからタイムゾーン名を探す（簡易版）
            const tzList = timezones as string[];
            const matching = tzList.find((tz) =>
                tz.includes(`UTC${offsetHours === '0' ? '' : offsetHours}`)
            );
            if (matching) {
                timezone = matching;
            }
        }

        const tzResponse = await fetch(
            `https://worldtimeapi.org/api/timezone/${timezone}`,
            {
                headers: {
                    'User-Agent': 'michikusa_memory_app',
                },
            }
        );

        if (!tzResponse.ok) {
            throw new Error(`WorldTimeAPI timezone error: ${tzResponse.status}`);
        }

        const tzData = await tzResponse.json();
        const localDateTime = new Date(tzData.datetime);

        return { timezone, localDateTime };
    } catch (error) {
        console.error('[Geolocation] WorldTimeAPI error:', error);
        return null;
    }
}

/**
 * 時間帯から明るさレベルを判定
 */
function calculateBrightness(hour: number): GeoLocation['brightness'] {
    if (hour >= 5 && hour < 7) {
        return 'early_morning';
    } else if (hour >= 7 && hour < 12) {
        return 'morning';
    } else if (hour >= 12 && hour < 18) {
        return 'afternoon';
    } else if (hour >= 18 && hour < 21) {
        return 'evening';
    } else if (hour >= 21 || hour < 5) {
        return 'night';
    }
    return 'dark';
}

/**
 * 緯度経度から Nominatim API で国コードを取得
 */
export async function getCountryCodeFromCoordinates(
    latitude: number,
    longitude: number
): Promise<GeoLocation> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
                headers: {
                    'Accept-Language': 'ja',
                    'User-Agent': 'michikusa_memory_app',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();

        // タイムゾーン情報を取得
        const timezoneInfo = await getTimezoneFromCoordinates(latitude, longitude);

        const localDateTime = timezoneInfo?.localDateTime || new Date();
        const brightness = calculateBrightness(localDateTime.getHours());

        return {
            latitude,
            longitude,
            countryCode: data.address?.country_code?.toUpperCase() || 'JP',
            countryName: data.address?.country || 'Japan',
            region: data.address?.state || data.address?.province,
            timezone: timezoneInfo?.timezone || 'Asia/Tokyo',
            localDateTime,
            brightness,
        };
    } catch (error) {
        console.error('[Geolocation] Nominatim API error:', error);
        // フォールバック（デフォルト日本）
        const now = new Date();
        return {
            latitude,
            longitude,
            countryCode: 'JP',
            countryName: 'Japan',
            timezone: 'Asia/Tokyo',
            localDateTime: now,
            brightness: calculateBrightness(now.getHours()),
        };
    }
}

/**
 * 位置情報を取得して国コード＋タイムゾーン情報を返す
 */
export async function getLocationInfo(): Promise<GeoLocation | null> {
    try {
        const coords = await getUserLocation();
        return await getCountryCodeFromCoordinates(coords.latitude, coords.longitude);
    } catch (error) {
        console.error('[Geolocation] Failed to get location:', error);
        return null;
    }
}