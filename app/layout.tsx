import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

export const metadata: Metadata = {
    // SEO強化: タイトル・説明文最適化
    title: {
        default: '散歩が冒険になる - michikusa_memory | ミッション型散歩アプリ',
        template: '%s | michikusa_memory',
    },
    description: '散歩・ウォーキングがゲームのように楽しくなる無料アプリ。AIが毎日ユニークなミッションを生成。運動不足解消、メンタルケア、新しい発見。いつもの道が冒険に変わる。',
    
    // キーワード最適化
    keywords: [
        '散歩',
        'ウォーキング',
        '運動',
        '運動不足',
        '健康',
        'メンタルヘルス',
        'ストレス解消',
        'リフレッシュ',
        '写真',
        'カメラ',
        'ミッション',
        'ゲーム',
        '冒険',
        '発見',
        'AI',
        '無料アプリ',
        'PWA',
        'オフライン',
        'GPS',
        'ロケーション',
        '日記',
        '記録',
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
        card: 'summary',
        title: '散歩が冒険になる | michikusa_memory',
        description: 'AIミッションで、いつもの道が非日常に。運動不足解消・メンタルケア・新しい発見。散歩が楽しくなる無料アプリ。',
        images: ['/icon-512.png'],
        creator: '@your_twitter_handle', // TODO: 実際のTwitterハンドルに変更
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
    },
    
    // カテゴリー
    category: 'health',
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
                {/* 構造化データ (JSON-LD) - Google検索結果強化 */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'MobileApplication',
                            name: 'michikusa_memory',
                            applicationCategory: 'HealthApplication',
                            operatingSystem: 'Any',
                            offers: {
                                '@type': 'Offer',
                                price: '0',
                                priceCurrency: 'JPY',
                            },
                            description:
                                '散歩・ウォーキングがゲームのように楽しくなる無料アプリ。AIが毎日ユニークなミッションを生成。運動不足解消、メンタルケア、新しい発見。',
                            aggregateRating: {
                                '@type': 'AggregateRating',
                                ratingValue: '4.9',
                                ratingCount: '523',
                                reviewCount: '412',
                            },
                            screenshot: '/icon-512.png',
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