import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: 'Googlebot',
                allow: ['/', '/contact'],
                disallow: ['/api/', '/_next/', '/setup', '/oracle', '/record', '/album', '/mypage', '/admin'],
                crawlDelay: 0,
            },
            {
                userAgent: 'Googlebot-Image',
                allow: '/',
            },
            {
                userAgent: 'AdsBot-Google',
                allow: '/',
                crawlDelay: 0,
            },
            {
                userAgent: 'AdsBot-Google-Mobile',
                allow: '/',
                crawlDelay: 0,
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/_next/', '/setup', '/oracle', '/record', '/album', '/mypage', '/admin'],
                crawlDelay: 1,
            },
        ],
        sitemap: 'https://michikusa-memory.vercel.app/sitemap.xml',
    };
}
