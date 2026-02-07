'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './logs.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

interface FlaggedLog {
    logId: string;
    userId: string;
    missionText: string;
    imageFlagReasons?: string[];
    imageCapturedAt?: string;
    createdAt: string;
    reviewed?: boolean;
}

export default function AdminLogsPage() {
    const { admin, isLoading } = useAdminAuth();
    const [logs, setLogs] = useState<FlaggedLog[]>([]);
    const [isLoading2, setIsLoading2] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [limit] = useState(25);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [reviewedFilter, setReviewedFilter] = useState<'unreviewed' | 'all' | 'reviewed'>('unreviewed');
    const [updatingLogId, setUpdatingLogId] = useState<string | null>(null);

    useEffect(() => {
        if (!admin || isLoading) return;

        const fetchLogs = async () => {
            try {
                setIsLoading2(true);
                const token = getTokenFromStorage();

                const response = await fetch(
                    `/api/admin/logs?flaggedOnly=true&limit=${limit}&page=${page}&reviewed=${reviewedFilter}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('ログ取得エラー');
                }

                const data = await response.json();
                console.log('[Admin Logs] Fetched logs:', {
                    count: data.logs.length,
                    sampleLog: data.logs[0],
                });
                setLogs(data.logs);
                setTotal(data.total);
            } catch (err) {
                console.error('[Admin Logs] Error:', err);
                setError('ログの取得に失敗しました');
            } finally {
                setIsLoading2(false);
            }
        };

        fetchLogs();
    }, [admin, isLoading, page, limit, reviewedFilter]);

    const handleMarkAsReviewed = async (log: FlaggedLog) => {
        try {
            setUpdatingLogId(log.logId);
            setError(null); // 既存のエラーをクリア

            const token = getTokenFromStorage();

            if (!token) {
                throw new Error('認証トークンが見つかりません。再ログインしてください。');
            }

            console.log('[Admin Logs] Sending PUT request:', {
                url: '/api/admin/logs',
                userId: log.userId,
                logId: log.logId,
                reviewed: !log.reviewed,
            });

            const response = await fetch('/api/admin/logs', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: log.userId,
                    logId: log.logId,
                    reviewed: !log.reviewed,
                }),
            });

            console.log('[Admin Logs] Response status:', response.status, response.statusText);

            if (!response.ok) {
                // レスポンスの詳細を取得
                const errorData = await response.json().catch(() => null);
                console.error('[Admin Logs] Error response:', errorData);

                const errorMsg = errorData?.error || errorData?.details || `更新に失敗しました (${response.status})`;
                throw new Error(errorMsg);
            }

            const result = await response.json();
            console.log('[Admin Logs] Update success:', result);

            // ローカル state を更新
            setLogs(logs.map(l => l.logId === log.logId ? { ...l, reviewed: !l.reviewed } : l));
        } catch (err) {
            console.error('[Admin Logs] Update error:', err);
            const errorMsg = err instanceof Error ? err.message : 'ログの更新に失敗しました';
            setError(errorMsg);
            alert(`エラー: ${errorMsg}`); // ユーザーに即座にフィードバック
        } finally {
            setUpdatingLogId(null);
        }
    };

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
                        <h1 className={styles.title}>🚩 フラグ付きログ監視</h1>
                        <Link href="/admin" className={styles.backLink}>
                            ← ダッシュボードへ
                        </Link>
                    </div>
                    <p className={styles.subtitle}>
                        共有機能が有効な場合、合致基準に基づいてフラグが付けられたログを表示します。
                    </p>
                </header>

                {error && <div className={styles.errorMessage}>{error}</div>}

                {/* タブ */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${reviewedFilter === 'unreviewed' ? styles.tabActive : ''}`}
                        onClick={() => {
                            setReviewedFilter('unreviewed');
                            setPage(0);
                        }}
                    >
                        未確認
                    </button>
                    <button
                        className={`${styles.tab} ${reviewedFilter === 'all' ? styles.tabActive : ''}`}
                        onClick={() => {
                            setReviewedFilter('all');
                            setPage(0);
                        }}
                    >
                        全て
                    </button>
                    <button
                        className={`${styles.tab} ${reviewedFilter === 'reviewed' ? styles.tabActive : ''}`}
                        onClick={() => {
                            setReviewedFilter('reviewed');
                            setPage(0);
                        }}
                    >
                        確認済み
                    </button>
                </div>

                <section className={styles.card}>
                    {isLoading2 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
                    ) : logs.length === 0 ? (
                        <div className={styles.emptyMessage}>
                            フラグ付きログはありません
                        </div>
                    ) : (
                        <div className={styles.logsList}>
                            {logs.map((log) => (
                                <div key={log.logId} className={styles.logItem}>
                                    <div className={styles.logHeader}>
                                        <div className={styles.logTitleArea}>
                                            <strong>{log.missionText}</strong>
                                            <span
                                                className={`${styles.reviewBadge} ${log.reviewed ? styles.reviewBadgeActive : ''}`}
                                            >
                                                {log.reviewed ? '✓ 確認済み' : '⭕ 未確認'}
                                            </span>
                                        </div>
                                        <span className={styles.userIdBadge}>ID: {log.userId}</span>
                                    </div>
                                    <div className={styles.logMeta}>
                                        <small>
                                            記録日時: {new Date(log.createdAt).toLocaleString('ja-JP')}
                                        </small>
                                        {log.imageCapturedAt && (
                                            <small>
                                                撮影日時: {new Date(log.imageCapturedAt).toLocaleString('ja-JP')}
                                            </small>
                                        )}
                                    </div>
                                    {log.imageFlagReasons && log.imageFlagReasons.length > 0 && (
                                        <div className={styles.flagReasons}>
                                            <strong>フラグ理由:</strong>
                                            <ul>
                                                {log.imageFlagReasons.map((reason, idx) => (
                                                    <li key={idx}>{reason}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className={styles.logActions}>
                                        <button
                                            className={`${styles.reviewButton} ${log.reviewed ? styles.reviewButtonReviewed : ''}`}
                                            onClick={() => handleMarkAsReviewed(log)}
                                            disabled={updatingLogId === log.logId}
                                        >
                                            {updatingLogId === log.logId
                                                ? '更新中...'
                                                : log.reviewed
                                                    ? '未確認に戻す'
                                                    : '確認済みにする'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {total > 0 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className={styles.paginationButton}
                        >
                            前へ
                        </button>
                        <span className={styles.pageInfo}>
                            {page + 1} - {Math.min((page + 1) * limit, total)} / {total}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={(page + 1) * limit >= total}
                            className={styles.paginationButton}
                        >
                            次へ
                        </button>
                    </div>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
