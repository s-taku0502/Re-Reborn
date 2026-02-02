'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // ローカルストレージからユーザーIDを取得
        const storedUserId = localStorage.getItem('reborn_userId');
        setUserId(storedUserId);
    }, []);

    const handleStart = () => {
        if (userId) {
            router.push('/oracle');
        } else {
            router.push('/setup');
        }
    };

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.title}>散歩Reborn</h1>
                <p className={styles.subtitle}>今日の散歩に、</p>
                <p className={styles.subtitle}>小さな意味を。</p>

                <div className={styles.buttonContainer}>
                    <button onClick={handleStart} className={styles.primaryButton}>
                        {userId ? 'ミッションを受ける' : '始める'}
                    </button>
                </div>

                {userId && (
                    <nav className={styles.nav}>
                        <button onClick={() => router.push('/album')} className={styles.navButton}>
                            冒険の書
                        </button>
                        <button onClick={() => router.push('/mypage')} className={styles.navButton}>
                            マイページ
                        </button>
                    </nav>
                )}
            </main>
        </div>
    );
}
