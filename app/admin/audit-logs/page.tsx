'use client';

import Link from 'next/link';
import styles from './audit-logs.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';

export default function AdminAuditLogsPage() {
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
                        <h1 className={styles.title}>📋 監査ログ</h1>
                        <Link href="/admin" className={styles.backLink}>
                            ← ダッシュボードへ
                        </Link>
                    </div>
                    <p className={styles.subtitle}>操作履歴の確認機能は準備中です。</p>
                </header>

                <section className={styles.card}>
                    <div className={styles.badge}>Coming Soon</div>
                    <p className={styles.message}>
                        管理者の操作履歴を可視化する監査ログビューを開発しています。
                    </p>
                    <div className={styles.meta}>
                        <div>予定: 期間フィルター / CSV出力 / ログ検索</div>
                        {admin?.email && <div>担当: {admin.email}</div>}
                    </div>
                </section>
            </div>
        </ProtectedAdminRoute>
    );
}
