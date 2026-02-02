'use client';

import { useRouter } from 'next/navigation';
import styles from './success.module.css';

export default function SuccessPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.iconBox}>
                    <span className={styles.icon}>✓</span>
                </div>

                <h1 className={styles.title}>記録しました</h1>
                <p className={styles.message}>
                    今日の冒険が<br />
                    冒険の書に刻まれました。
                </p>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={() => router.push('/album')}
                        className={styles.primaryButton}
                    >
                        冒険の書を見る
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className={styles.secondaryButton}
                    >
                        続けてミッションを受ける
                    </button>
                </div>
            </main>
        </div>
    );
}
