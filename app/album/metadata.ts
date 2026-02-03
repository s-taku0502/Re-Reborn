import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '冒険の書 - michikusa_memory',
    description: 'これまでの散歩記録と写真をアルバムで管理。思い出の冒険を一覧で閲覧・削除できます。',
    robots: {
        index: false,
        follow: true,
    },
    openGraph: {
        title: '冒険の書 | michikusa_memory',
        description: 'あなたの散歩の記録と写真アルバム',
        type: 'website',
    },
};
