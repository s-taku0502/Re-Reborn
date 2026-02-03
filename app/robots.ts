import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/_next/', '/setup', '/oracle', '/record', '/album', '/mypage'],
            crawlDelay: 1,
        },
        sitemap: 'https://sanpo-reborn.vercel.app/sitemap.xml',
    };
}
