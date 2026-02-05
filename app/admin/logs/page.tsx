'use client';

import Link from 'next/link';
import styles from './logs.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';

export default function AdminLogsPage() {
    const { admin, isLoading } = useAdminAuth();

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <ProtectedAdminRoute>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>🗑️ ログ削除</h1>
                        <Link href="/admin" className={styles.backLink}>
                            ← ダッシュボードへ
                        </Link>
                    </div>
                    <p className={styles.subtitle}>ログのモデレーション機能は準備中です。</p>
                </header>

                <section className={styles.card}>
                    <div className={styles.badge}>Coming Soon</div>
                    <p className={styles.message}>
                        現在、削除対象のログ一覧と一括処理機能を開発中です。
                    </p>
                    <div className={styles.meta}>
                        <div>予定: ログ検索 / 監査ログ連携 / 一括削除</div>
                        {admin?.email && <div>担当: {admin.email}</div>}
                    </div>
                </section>
            </div>
        </ProtectedAdminRoute>
    );
}
