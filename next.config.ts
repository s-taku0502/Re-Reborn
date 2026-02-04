import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://apis.google.com https://*.googleapis.com https://*.gstatic.com https://pagead2.googlesyndication.com https://*.adtrafficquality.google`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google",
    "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.cloudinary.com https://nominatim.openstreetmap.org https://www.google-analytics.com https://analytics.google.com https://ep1.adtrafficquality.google https://*.doubleclick.net https://*.google.com https://pagead2.googlesyndication.com",
    "font-src 'self'",
    "frame-src https://accounts.google.com https://*.firebaseapp.com https://*.doubleclick.net https://*.google.com https://googleads.g.doubleclick.net https://*.adtrafficquality.google",
].join('; ');

const securityHeaders = [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=()' },
];

const seoHeaders = [
    // OGP用の最適化ヘッダー
    { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
];

const allHeaders = [...securityHeaders, ...seoHeaders];

const nextConfig: NextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: allHeaders,
            },
            // XMLサイトマップへのキャッシュ
            {
                source: '/sitemap.xml',
                headers: [
                    { key: 'Content-Type', value: 'application/xml' },
                    { key: 'Cache-Control', value: 'public, max-age=86400' },
                ],
            },
            // robots.txtへのキャッシュ
            {
                source: '/robots.txt',
                headers: [
                    { key: 'Content-Type', value: 'text/plain' },
                    { key: 'Cache-Control', value: 'public, max-age=86400' },
                ],
            },
        ];
    },
    // PWA設定（next-pwaの代わりにシンプルな設定）
    webpack: (config) => {
        return config;
    },
    // 画像の最適化
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
};

export default nextConfig;
