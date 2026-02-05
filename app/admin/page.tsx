'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';

interface DashboardStats {
    totalUsers: number;
    totalLogs: number;
    totalContacts: number;
    pendingContacts: number;
}

export default function AdminDashboard() {
    const { admin, logout, isLoading } = useAdminAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // ダッシュボード統計を取得（将来実装）
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 仮のデータ（API実装後に動的に取得）
                setStats({
                    totalUsers: 156,
                    totalLogs: 1250,
                    totalContacts: 42,
                    pendingContacts: 3,
                });
            } catch (error) {
                console.error('[Dashboard] Error fetching stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <ProtectedAdminRoute>
            <div className={styles.dashboard}>
                {/* ヘッダー */}
                <div className={styles.dashboardHeader}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.headerTitle}>🏠 管理者ダッシュボード</h1>
                        <div className={styles.headerActions}>
                            {admin && (
                                <div className={styles.adminInfo}>
                                    <div>
                                        <div>👤 {admin.email}</div>
                                        <span className={styles.roleBadge}>
                                            {admin.role === 'superadmin'
                                                ? '🔐 スーパー管理者'
                                                : admin.role === 'admin'
                                                    ? '👨‍💼 管理者'
                                                    : '👨‍⚖️ モデレーター'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <button
                                className={styles.logoutButton}
                                onClick={logout}
                            >
                                ログアウト
                            </button>
                        </div>
                    </div>

                    {/* 統計情報 */}
                    {!statsLoading && stats && (
                        <div className={styles.headerStats}>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>👥 ユーザー数</div>
                                <div className={styles.statValue}>{stats.totalUsers}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>📝 記録総数</div>
                                <div className={styles.statValue}>{stats.totalLogs}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>💬 お問い合わせ</div>
                                <div className={styles.statValue}>{stats.totalContacts}</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statLabel}>⏳ 対応待ち</div>
                                <div className={styles.statValue}>{stats.pendingContacts}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* メインコンテンツ */}
                <div className={styles.dashboardContent}>
                    {/* メニューセクション */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>📋 機能メニュー</h2>
                        <div className={styles.moduleGrid}>
                            {/* お問い合わせ管理 */}
                            <Link href="/admin/contacts" className={styles.moduleCard}>
                                <span className={styles.moduleIcon}>💬</span>
                                <span className={styles.moduleName}>お問い合わせ</span>
                            </Link>

                            {/* ユーザー管理 */}
                            {(admin?.role === 'superadmin' || admin?.role === 'admin') && (
                                <Link href="/admin/users" className={styles.moduleCard}>
                                    <span className={styles.moduleIcon}>👥</span>
                                    <span className={styles.moduleName}>ユーザー管理</span>
                                </Link>
                            )}

                            {/* ログモデレーション */}
                            <Link href="/admin/logs" className={styles.moduleCard}>
                                <span className={styles.moduleIcon}>🗑️</span>
                                <span className={styles.moduleName}>ログ削除</span>
                            </Link>

                            {/* 統計分析 */}
                            {(admin?.role === 'superadmin' || admin?.role === 'admin') && (
                                <Link href="/admin/statistics" className={styles.moduleCard}>
                                    <span className={styles.moduleIcon}>📊</span>
                                    <span className={styles.moduleName}>統計分析</span>
                                </Link>
                            )}

                            {/* システム設定 */}
                            {admin?.role === 'superadmin' && (
                                <Link href="/admin/settings" className={styles.moduleCard}>
                                    <span className={styles.moduleIcon}>⚙️</span>
                                    <span className={styles.moduleName}>システム設定</span>
                                </Link>
                            )}

                            {/* 管理者管理 */}
                            {admin?.role === 'superadmin' && (
                                <Link href="/admin/manage-admins" className={styles.moduleCard}>
                                    <span className={styles.moduleIcon}>🔐</span>
                                    <span className={styles.moduleName}>管理者管理</span>
                                </Link>
                            )}

                            {/* 監査ログ */}
                            {admin?.role === 'superadmin' && (
                                <Link href="/admin/audit-logs" className={styles.moduleCard}>
                                    <span className={styles.moduleIcon}>📋</span>
                                    <span className={styles.moduleName}>監査ログ</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* 最近のアクティビティ（プレースホルダー） */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>📌 最近のアクティビティ</h2>
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>📭</div>
                            <p>最近のアクティビティはありません</p>
                        </div>
                    </div>

                    {/* ヘルプセクション */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>ℹ️ サポート</h2>
                        <ul className={styles.activityList}>
                            <li className={styles.activityItem}>
                                <div className={styles.activityInfo}>
                                    <div className={styles.activityAction}>
                                        📖 ドキュメント
                                    </div>
                                    <div className={styles.activityTime}>
                                        管理画面の使用方法を確認する
                                    </div>
                                </div>
                            </li>
                            <li className={styles.activityItem}>
                                <div className={styles.activityInfo}>
                                    <div className={styles.activityAction}>
                                        🐛 バグ報告
                                    </div>
                                    <div className={styles.activityTime}>
                                        問題を見つけた場合は報告してください
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </ProtectedAdminRoute>
    );
}
