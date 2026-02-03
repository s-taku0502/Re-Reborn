import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ミッション記録 - michikusa_memory',
    description: '散歩で撮った写真や感想をミッション記録に登録。あなたの冒険の足跡を記録しましょう。',
    robots: {
        index: false,
        follow: true,
    },
    openGraph: {
        title: 'ミッション記録 | michikusa_memory',
        description: '散歩の記録と写真をアップロード',
        type: 'website',
    },
};
