import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'マイページ - michikusa_memory',
    description: 'あなたのプロフィール情報を管理。パスワード変更やアカウント削除はここから。',
    robots: {
        index: false,
        follow: true,
    },
    openGraph: {
        title: 'マイページ | michikusa_memory',
        description: 'プロフィール設定とアカウント管理',
        type: 'website',
    },
};
