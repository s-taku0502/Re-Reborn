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

type MonthlySortKey = keyof MonthlyStats;
type DailySortKey = keyof DailyStats;
type SortOrder = 'asc' | 'desc';

export default function StatisticsPage() {
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [tab, setTab] = useState<TabType>('monthly');
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // ソート状態
    const [monthlySortKey, setMonthlySortKey] = useState<MonthlySortKey>('month');
    const [monthlySortOrder, setMonthlySortOrder] = useState<SortOrder>('desc');
    const [dailySortKey, setDailySortKey] = useState<DailySortKey>('date');
    const [dailySortOrder, setDailySortOrder] = useState<SortOrder>('desc');

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

    // ソート関数
    const handleMonthlySort = (key: MonthlySortKey) => {
        if (monthlySortKey === key) {
            // 同じキーをクリックした場合は順序を反転
            setMonthlySortOrder(monthlySortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // 新しいキーの場合は降順でスタート
            setMonthlySortKey(key);
            setMonthlySortOrder('desc');
        }
    };

    const handleDailySort = (key: DailySortKey) => {
        if (dailySortKey === key) {
            setDailySortOrder(dailySortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setDailySortKey(key);
            setDailySortOrder('desc');
        }
    };

    // ソートされたデータを取得
    const sortedMonthlyStats = [...monthlyStats].sort((a, b) => {
        const aValue = a[monthlySortKey];
        const bValue = b[monthlySortKey];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return monthlySortOrder === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return monthlySortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
    });

    const sortedDailyStats = [...dailyStats].sort((a, b) => {
        const aValue = a[dailySortKey];
        const bValue = b[dailySortKey];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return dailySortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return dailySortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
    });

    // ソートインジケーター
    const getSortIcon = (key: MonthlySortKey | DailySortKey, currentKey: MonthlySortKey | DailySortKey, currentOrder: SortOrder) => {
        if (key !== currentKey) return ' ⇅';
        return currentOrder === 'asc' ? ' ↑' : ' ↓';
    };

    // ソートリセット関数
    const handleMonthlyReset = () => {
        setMonthlySortKey('month');
        setMonthlySortOrder('desc');
    };

    const handleDailyReset = () => {
        setDailySortKey('date');
        setDailySortOrder('desc');
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
                            <div className={styles.contentHeader}>
                                <h2 className={styles.contentTitle}>📅 月別統計詳細</h2>
                                <button 
                                    className={styles.resetButton}
                                    onClick={handleMonthlyReset}
                                    disabled={monthlySortKey === 'month' && monthlySortOrder === 'desc'}
                                >
                                    🔄 リセット
                                </button>
                            </div>
                            {monthlyStats.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>データがありません</p>
                                </div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleMonthlySort('month')} className={styles.sortableHeader}>
                                                月{getSortIcon('month', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('newUsers')} className={styles.sortableHeader}>
                                                新規ユーザー{getSortIcon('newUsers', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('activeUsers')} className={styles.sortableHeader}>
                                                アクティブ{getSortIcon('activeUsers', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('totalWalkingLogs')} className={styles.sortableHeader}>
                                                散歩記録{getSortIcon('totalWalkingLogs', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('totalDistanceWalked')} className={styles.sortableHeader}>
                                                総距離{getSortIcon('totalDistanceWalked', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('averageWalkDistance')} className={styles.sortableHeader}>
                                                平均距離{getSortIcon('averageWalkDistance', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('newContacts')} className={styles.sortableHeader}>
                                                お問い合わせ{getSortIcon('newContacts', monthlySortKey, monthlySortOrder)}
                                            </th>
                                            <th onClick={() => handleMonthlySort('contactsResolved')} className={styles.sortableHeader}>
                                                解決済み{getSortIcon('contactsResolved', monthlySortKey, monthlySortOrder)}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedMonthlyStats.map((stat) => (
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
                            <div className={styles.contentHeader}>
                                <h2 className={styles.contentTitle}>📆 日別統計詳細</h2>
                                <button 
                                    className={styles.resetButton}
                                    onClick={handleDailyReset}
                                    disabled={dailySortKey === 'date' && dailySortOrder === 'desc'}
                                >
                                    🔄 リセット
                                </button>
                            </div>
                            {dailyStats.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>データがありません</p>
                                </div>
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleDailySort('date')} className={styles.sortableHeader}>
                                                日付{getSortIcon('date', dailySortKey, dailySortOrder)}
                                            </th>
                                            <th onClick={() => handleDailySort('newUsers')} className={styles.sortableHeader}>
                                                新規ユーザー{getSortIcon('newUsers', dailySortKey, dailySortOrder)}
                                            </th>
                                            <th onClick={() => handleDailySort('newWalkingLogs')} className={styles.sortableHeader}>
                                                散歩記録{getSortIcon('newWalkingLogs', dailySortKey, dailySortOrder)}
                                            </th>
                                            <th onClick={() => handleDailySort('totalDistanceWalked')} className={styles.sortableHeader}>
                                                総距離{getSortIcon('totalDistanceWalked', dailySortKey, dailySortOrder)}
                                            </th>
                                            <th onClick={() => handleDailySort('newContacts')} className={styles.sortableHeader}>
                                                お問い合わせ{getSortIcon('newContacts', dailySortKey, dailySortOrder)}
                                            </th>
                                            <th onClick={() => handleDailySort('contactsResolved')} className={styles.sortableHeader}>
                                                解決済み{getSortIcon('contactsResolved', dailySortKey, dailySortOrder)}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDailyStats.map((stat) => (
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
