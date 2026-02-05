'use client';

import { useState, useEffect } from 'react';
import styles from './statistics.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

interface DailyStats {
    date: string;
    newUsers: number;
    newWalkingLogs: number;
    totalDistanceWalked: number;
    newContacts: number;
    contactsResolved: number;
}

interface MonthlyStats {
    month: string;
    newUsers: number;
    activeUsers: number;
    totalWalkingLogs: number;
    totalDistanceWalked: number;
    averageWalkDistance: number;
    newContacts: number;
    contactsResolved: number;
}

type TabType = 'daily' | 'monthly';

export default function StatisticsPage() {
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [tab, setTab] = useState<TabType>('monthly');
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // 統計データを取得
    useEffect(() => {
        if (authLoading || !admin) return;

        const fetchStats = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const token = getTokenFromStorage();
                if (!token) {
                    setError('認証トークンがありません');
                    return;
                }

                // 月次統計を取得
                const monthlyResponse = await fetch('/api/admin/statistics/monthly?months=12', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!monthlyResponse.ok) {
                    throw new Error('統計の取得に失敗しました');
                }

                const monthlyData = await monthlyResponse.json();
                setMonthlyStats(monthlyData.stats);

                // 日次統計も取得
                const dailyResponse = await fetch('/api/admin/statistics/daily?days=30', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (dailyResponse.ok) {
                    const dailyData = await dailyResponse.json();
                    setDailyStats(dailyData.stats);
                }
            } catch (err) {
                console.error('[Statistics] Error fetching stats:', err);
                setError('統計の取得中にエラーが発生しました');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [admin, authLoading]);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            setError(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const typeParam = tab === 'daily' ? 'daily' : 'monthly';
            const response = await fetch(`/api/admin/statistics/export?type=${typeParam}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('エクスポートに失敗しました');
            }

            // ファイルをダウンロード
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stats-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[Statistics] Error exporting:', err);
            setError('エクスポート中にエラーが発生しました');
        } finally {
            setIsExporting(false);
        }
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString('ja-JP');
    };

    const formatDistance = (meters: number) => {
        if (meters < 1000) {
            return `${meters}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    // 月次統計の要約情報
    const latestMonth = monthlyStats[monthlyStats.length - 1];
    const previousMonth = monthlyStats[monthlyStats.length - 2];

    const totalUsersChange = previousMonth
        ? latestMonth.newUsers - previousMonth.newUsers
        : 0;
    const activeUsersChange = previousMonth
        ? latestMonth.activeUsers - previousMonth.activeUsers
        : 0;

    // 日次統計の要約情報
    const latestDay = dailyStats[dailyStats.length - 1];
    const previousDay = dailyStats[dailyStats.length - 2];

    const dailyUsersChange = previousDay
        ? latestDay.newUsers - previousDay.newUsers
        : 0;
    const dailyLogsChange = previousDay
        ? latestDay.newWalkingLogs - previousDay.newWalkingLogs
        : 0;

    return (
        <ProtectedAdminRoute>
            <div className={styles.statisticsContainer}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>📊 統計ダッシュボード</h1>
                        <div className={styles.controls}>
                            <button
                                className={`${styles.tabButton} ${tab === 'monthly' ? styles.active : ''}`}
                                onClick={() => setTab('monthly')}
                            >
                                📅 月別
                            </button>
                            <button
                                className={`${styles.tabButton} ${tab === 'daily' ? styles.active : ''}`}
                                onClick={() => setTab('daily')}
                            >
                                📆 日別
                            </button>
                            <button
                                className={styles.exportButton}
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? '出力中...' : '📥 CSVエクスポート'}
                            </button>
                        </div>
                    </div>
                    <p className={styles.subtitle}>
                        アプリケーション全体の統計情報を表示します（管理者・スーパー管理者のみ）
                    </p>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                {/* 月別ビュー */}
                {tab === 'monthly' && (
                    <>
                        {/* 統計カード */}
                        {latestMonth && (
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>新規ユーザー</div>
                                    <div className={styles.statValue}>{formatNumber(latestMonth.newUsers)}</div>
                                    <div className={styles.statChange}>
                                        {totalUsersChange > 0 ? (
                                            <span className={styles.statChangePositive}>
                                                ↑ 先月より {totalUsersChange} 増加
                                            </span>
                                        ) : totalUsersChange < 0 ? (
                                            <span className={styles.statChangeNegative}>
                                                ↓ 先月より {Math.abs(totalUsersChange)} 減少
                                            </span>
                                        ) : (
                                            <span>先月と同数</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`${styles.statCard} ${styles.secondary}`}>
                                    <div className={styles.statLabel}>アクティブユーザー</div>
                                    <div className={styles.statValue}>{formatNumber(latestMonth.activeUsers)}</div>
                                    <div className={styles.statChange}>
                                        {activeUsersChange > 0 ? (
                                            <span className={styles.statChangePositive}>
                                                ↑ 先月より {activeUsersChange} 増加
                                            </span>
                                        ) : activeUsersChange < 0 ? (
                                            <span className={styles.statChangeNegative}>
                                                ↓ 先月より {Math.abs(activeUsersChange)} 減少
                                            </span>
                                        ) : (
                                            <span>先月と同数</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`${styles.statCard} ${styles.success}`}>
                                    <div className={styles.statLabel}>散歩記録</div>
                                    <div className={styles.statValue}>{formatNumber(latestMonth.totalWalkingLogs)}</div>
                                    <div className={styles.statChange}>
                                        平均 <span className={styles.numberHighlight}>
                                            {formatDistance(latestMonth.averageWalkDistance)}
                                        </span>
                                    </div>
                                </div>

                                <div className={`${styles.statCard} ${styles.warning}`}>
                                    <div className={styles.statLabel}>お問い合わせ</div>
                                    <div className={styles.statValue}>{formatNumber(latestMonth.newContacts)}</div>
                                    <div className={styles.statChange}>
                                        解決済み <span className={styles.numberHighlight}>
                                            {latestMonth.contactsResolved}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 月次テーブル */}
                        <div className={styles.content}>
                            <h2 className={styles.contentTitle}>📅 月別統計詳細</h2>
                            {monthlyStats.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>データがありません</p>
                                </div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>月</th>
                                            <th>新規ユーザー</th>
                                            <th>アクティブ</th>
                                            <th>散歩記録</th>
                                            <th>総距離</th>
                                            <th>平均距離</th>
                                            <th>お問い合わせ</th>
                                            <th>解決済み</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyStats.map((stat) => (
                                            <tr key={stat.month}>
                                                <td>{stat.month}</td>
                                                <td>{formatNumber(stat.newUsers)}</td>
                                                <td>{formatNumber(stat.activeUsers)}</td>
                                                <td>{formatNumber(stat.totalWalkingLogs)}</td>
                                                <td>{formatDistance(stat.totalDistanceWalked)}</td>
                                                <td>{formatDistance(stat.averageWalkDistance)}</td>
                                                <td>{formatNumber(stat.newContacts)}</td>
                                                <td>{formatNumber(stat.contactsResolved)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* 日別ビュー */}
                {tab === 'daily' && (
                    <>
                        {/* 統計カード */}
                        {latestDay && (
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statLabel}>新規ユーザー</div>
                                    <div className={styles.statValue}>{formatNumber(latestDay.newUsers)}</div>
                                    <div className={styles.statChange}>
                                        {dailyUsersChange > 0 ? (
                                            <span className={styles.statChangePositive}>
                                                ↑ 前日より {dailyUsersChange} 増加
                                            </span>
                                        ) : dailyUsersChange < 0 ? (
                                            <span className={styles.statChangeNegative}>
                                                ↓ 前日より {Math.abs(dailyUsersChange)} 減少
                                            </span>
                                        ) : (
                                            <span>前日と同数</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`${styles.statCard} ${styles.success}`}>
                                    <div className={styles.statLabel}>散歩記録</div>
                                    <div className={styles.statValue}>{formatNumber(latestDay.newWalkingLogs)}</div>
                                    <div className={styles.statChange}>
                                        {dailyLogsChange > 0 ? (
                                            <span className={styles.statChangePositive}>
                                                ↑ 前日より {dailyLogsChange} 増加
                                            </span>
                                        ) : dailyLogsChange < 0 ? (
                                            <span className={styles.statChangeNegative}>
                                                ↓ 前日より {Math.abs(dailyLogsChange)} 減少
                                            </span>
                                        ) : (
                                            <span>前日と同数</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`${styles.statCard} ${styles.secondary}`}>
                                    <div className={styles.statLabel}>総距離</div>
                                    <div className={styles.statValue}>{formatDistance(latestDay.totalDistanceWalked)}</div>
                                </div>

                                <div className={`${styles.statCard} ${styles.warning}`}>
                                    <div className={styles.statLabel}>お問い合わせ</div>
                                    <div className={styles.statValue}>{formatNumber(latestDay.newContacts)}</div>
                                    <div className={styles.statChange}>
                                        解決済み <span className={styles.numberHighlight}>
                                            {latestDay.contactsResolved}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 日次テーブル */}
                        <div className={styles.content}>
                            <h2 className={styles.contentTitle}>📆 日別統計詳細</h2>
                            {dailyStats.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>データがありません</p>
                                </div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>日付</th>
                                            <th>新規ユーザー</th>
                                            <th>散歩記録</th>
                                            <th>総距離</th>
                                            <th>お問い合わせ</th>
                                            <th>解決済み</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyStats.map((stat) => (
                                            <tr key={stat.date}>
                                                <td>{stat.date}</td>
                                                <td>{formatNumber(stat.newUsers)}</td>
                                                <td>{formatNumber(stat.newWalkingLogs)}</td>
                                                <td>{formatDistance(stat.totalDistanceWalked)}</td>
                                                <td>{formatNumber(stat.newContacts)}</td>
                                                <td>{formatNumber(stat.contactsResolved)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
