'use client';

import { useRouter } from 'next/navigation';
import styles from './success.module.css';

export default function ContactSuccessPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.icon}>✓</div>
                <h1 className={styles.title}>送信完了</h1>
                <p className={styles.message}>
                    お問い合わせありがとうございます。
                    <br />
                    内容を確認次第、ご連絡させていただきます。
                </p>
                <button onClick={() => router.push('/')} className={styles.homeButton}>
                    ホームに戻る
                </button>
            </div>
        </div>
    );
}
