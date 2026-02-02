/**
 * サイトマップ生成
 * - Next.jsのMetadataRouteを利用して /sitemap.xml を自動生成
 * - 本番URLは NEXT_PUBLIC_SITE_URL または VERCEL_URL を使用
 * - 主要ページのみを静的に列挙
 * 
 * ルート一覧:
 * - / : ホーム（ログイン状態に応じて setup または oracle へ遷移）
 * - /setup : 新規登録・ログイン画面
 * - /oracle : ミッション受信ページ（認証必須）
 * - /record : ミッション記録ページ（認証必須）
 * - /album : 冒険ログアルバム（認証必須）
 * - /mypage : マイページ（認証必須）
 */
import type { MetadataRoute } from 'next';

const defaultBaseUrl = 'http://localhost:3000';

function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return defaultBaseUrl;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = getBaseUrl();
    const lastModified = new Date();

    // 公開ページと認証後ページの一覧
    const routes = [
        { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
        { path: '/setup', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/oracle', priority: 0.9, changeFrequency: 'always' as const },
        { path: '/record', priority: 0.8, changeFrequency: 'always' as const },
        { path: '/album', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/mypage', priority: 0.7, changeFrequency: 'monthly' as const },
    ];

    return routes.map(({ path, priority, changeFrequency }) => ({
        url: `${baseUrl}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}

