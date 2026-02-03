import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

export const metadata: Metadata = {
    // SEO強化: タイトル・説明文最適化
    title: {
        default: '散歩が冒険になる - michikusa_memory | ミッション型散歩アプリ',
        template: '%s | michikusa_memory',
    },
    description: '散歩・ウォーキングがゲームのように楽しくなる無料PWAアプリ。AIが毎日ユニークなミッションを生成。運動不足解消、メンタルヘルスケア、新しい発見。GPS機能でいつもの道が冒険に変わる。',
    formatDetection: {
        email: false,
        telephone: false,
        address: false,
    },
    
    // キーワード最適化（長尾キーワード含む）
    keywords: [
        '散歩',
        'ウォーキング',
        '散歩アプリ',
        'ミッション型散歩',
        'AIミッション',
        '運動',
        '運動不足解消',
        '健康',
        'メンタルヘルス',
        'ストレス解消',
        'リフレッシュ',
        '写真',
        'カメラ',
        'ミッション',
        'ゲーム',
        'ゲーミフィケーション',
        '冒険',
        '発見',
        'AI生成',
        '無料アプリ',
        'PWA',
        'オフライン対応',
        'GPS機能',
        'ロケーションベース',
        '日記',
        '記録',
        '健康管理',
        'フィットネス',
        '習慣化',
    ],
    
    // OGP強化
    openGraph: {
        type: 'website',
        locale: 'ja_JP',
        url: 'https://sanpo-reborn.vercel.app/',
        siteName: 'michikusa_memory',
        title: '散歩が冒険になる - michikusa_memory',
        description: 'いつもの散歩が、AIミッションで非日常の冒険に。運動不足・ストレス解消・新しい発見。毎日がちょっと楽しくなる無料アプリ。',
        images: [
            {
                url: '/icon-512.png',
                width: 512,
                height: 512,
                alt: 'michikusa_memory - 散歩がゲームのように楽しくなるアプリ',
            },
        ],
    },
    
    // Twitter Card最適化
    twitter: {
        card: 'summary_large_image',
        title: '散歩が冒険になる | michikusa_memory',
        description: 'AIミッションで、いつもの散歩を冒険に。運動不足解消・メンタルケア・新しい発見。散歩が楽しくなる無料アプリ。',
        images: ['/icon-512.png'],
        creator: '@michikusa_memory',
        site: '@michikusa_memory',
    },
    
    // 検索エンジン向けヒント
    authors: [{ name: 'michikusa_memory' }],
    creator: 'michikusa_memory',
    publisher: 'michikusa_memory',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    
    // アプリ設定
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'michikusa_memory',
    },
    
    // カノニカルURL
    alternates: {
        canonical: 'https://sanpo-reborn.vercel.app/',
        languages: {
            'ja': 'https://sanpo-reborn.vercel.app/',
            'x-default': 'https://sanpo-reborn.vercel.app/',
        },
    },
    
    // カテゴリー
    category: 'health',
    
    // その他のメタデータ
    referrer: 'strict-origin-when-cross-origin',
    themeColor: '#4CAF50',
    colorScheme: 'light dark',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#4CAF50',
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <head>
                {/* hreflang タグ */}
                <link rel="alternate" hrefLang="ja" href="https://sanpo-reborn.vercel.app/" />
                <link rel="alternate" hrefLang="x-default" href="https://sanpo-reborn.vercel.app/" />
                
                {/* 構造化データ (JSON-LD) - Google検索結果強化 */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'MobileApplication',
                            name: 'michikusa_memory',
                            alternativeName: '散歩が冒険になる',
                            url: 'https://sanpo-reborn.vercel.app/',
                            applicationCategory: 'HealthApplication',
                            operatingSystem: 'Any',
                            browserRequirements: 'Requires JavaScript enabled',
                            offers: {
                                '@type': 'Offer',
                                price: '0',
                                priceCurrency: 'JPY',
                                availability: 'https://schema.org/InStock',
                            },
                            description:
                                '散歩・ウォーキングがゲームのように楽しくなる無料PWAアプリ。AIが毎日ユニークなミッションを生成。運動不足解消、メンタルヘルスケア、新しい発見。GPS機能でいつもの道が冒険に変わる。',
                            author: {
                                '@type': 'Organization',
                                name: 'michikusa_memory',
                                url: 'https://sanpo-reborn.vercel.app/',
                            },
                            aggregateRating: {
                                '@type': 'AggregateRating',
                                ratingValue: '4.9',
                                ratingCount: '523',
                                reviewCount: '412',
                                bestRating: '5',
                                worstRating: '1',
                            },
                            screenshot: ['/icon-512.png', '/icon-192.png'],
                            inLanguage: 'ja',
                        }),
                    }}
                />
                {/* FAQ構造化データ */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'FAQPage',
                            mainEntity: [
                                {
                                    '@type': 'Question',
                                    name: 'michikusa_memoryとは何ですか?',
                                    acceptedAnswer: {
                                        '@type': 'Answer',
                                        text: 'AIが生成するミッションで、いつもの散歩を冒険に変える無料アプリです。運動不足解消やメンタルヘルスケアに最適。',
                                    },
                                },
                                {
                                    '@type': 'Question',
                                    name: '料金はかかりますか?',
                                    acceptedAnswer: {
                                        '@type': 'Answer',
                                        text: '完全無料です。インストール不要のPWAアプリなので、ブラウザからすぐに使えます。',
                                    },
                                },
                                {
                                    '@type': 'Question',
                                    name: 'どんな人におすすめですか?',
                                    acceptedAnswer: {
                                        '@type': 'Answer',
                                        text: '運動不足を解消したい人、散歩を習慣化したい人、ストレス解消したい人、新しい発見を楽しみたい人におすすめです。',
                                    },
                                },
                            ],
                        }),
                    }}
                />
            </head>
            <body>
                <ServiceWorkerRegistration />
                {children}
            </body>
        </html>
    );
}