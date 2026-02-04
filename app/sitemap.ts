/**
 * サイトマップ生成
 * - Next.jsのMetadataRouteを利用して /sitemap.xml を自動生成
 * - 本番URLは NEXT_PUBLIC_SITE_URL または VERCEL_URL を使用
 * - 公開ページのみを列挙（認証必須ページは除外）
 * 
 * 公開ページ（検索エンジン向け）:
 * - / : ホーム（SEO最適化）
 * - /setup : 新規登録・ログイン（インデックス不要、noindex設定）
 * 
 * 認証必須ページ（クローラーがアクセス不可）:
 * - /oracle : ミッション受信
 * - /record : ミッション記録
 * - /album : 冒険ログアルバム
 * - /mypage : マイページ
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

    // 公開ページのみをサイトマップに含める
    const routes = [
        { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
        { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/setup', priority: 0.7, changeFrequency: 'monthly' as const },
    ];

    return routes.map(({ path, priority, changeFrequency }) => ({
        url: `${baseUrl}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}

