'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './contacts.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

interface Contact {
    contactId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'inProgress' | 'resolved' | 'closed';
    createdAt: string;
    updatedAt: string | null;
    readAt: string | null;
}

interface ContactsStats {
    total: number;
    new: number;
    read: number;
    inProgress: number;
    resolved: number;
    closed: number;
}

export default function AdminContactsPage() {
    const router = useRouter();
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [stats, setStats] = useState<ContactsStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // フィルター・ページネーション
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 25;

    // お問い合わせ一覧と統計を取得
    useEffect(() => {
        if (authLoading || !admin) return;

        const fetchContacts = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const token = getTokenFromStorage();
                if (!token) {
                    setError('認証トークンがありません');
                    return;
                }

                const offset = (currentPage - 1) * limit;
                const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`;

                const response = await fetch(
                    `/api/admin/contacts?limit=${limit}&offset=${offset}${statusParam}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('お問い合わせの取得に失敗しました');
                }

                const data = await response.json();
                setContacts(data.contacts || []);
                setTotal(data.total || 0);
            } catch (err) {
                console.error('[Contacts] Error fetching contacts:', err);
                setError('お問い合わせの取得中にエラーが発生しました');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContacts();
    }, [admin, authLoading, statusFilter, currentPage]);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'new':
                return `${styles.statusBadge} ${styles.statusNew}`;
            case 'read':
                return `${styles.statusBadge} ${styles.statusRead}`;
            case 'inProgress':
                return `${styles.statusBadge} ${styles.statusInProgress}`;
            case 'resolved':
                return `${styles.statusBadge} ${styles.statusResolved}`;
            case 'closed':
                return `${styles.statusBadge} ${styles.statusClosed}`;
            default:
                return styles.statusBadge;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'new':
                return '新規';
            case 'read':
                return '既読';
            case 'inProgress':
                return '対応中';
            case 'resolved':
                return '解決済み';
            case 'closed':
                return '完了';
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const totalPages = Math.ceil(total / limit);

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <ProtectedAdminRoute>
            <div className={styles.contactsContainer}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>💬 お問い合わせ管理</h1>
                        <Link href="/admin" className={styles.backButton}>
                            ← ダッシュボードに戻る
                        </Link>
                    </div>

                    {/* フィルター */}
                    <div className={styles.filterBar}>
                        <select
                            className={styles.filterSelect}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="all">すべて</option>
                            <option value="new">新規</option>
                            <option value="read">既読</option>
                            <option value="inProgress">対応中</option>
                            <option value="resolved">解決済み</option>
                            <option value="closed">完了</option>
                        </select>
                    </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                {contacts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📭</div>
                        <p>お問い合わせがありません</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.table}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>送信者</th>
                                        <th>件名</th>
                                        <th>ステータス</th>
                                        <th>送信日時</th>
                                        <th>アクション</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map((contact) => (
                                        <tr key={contact.contactId}>
                                            <td>
                                                <div>{contact.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                    {contact.email}
                                                </div>
                                            </td>
                                            <td>{contact.subject}</td>
                                            <td>
                                                <span className={getStatusBadgeClass(contact.status)}>
                                                    {getStatusLabel(contact.status)}
                                                </span>
                                            </td>
                                            <td>{formatDate(contact.createdAt)}</td>
                                            <td>
                                                <Link
                                                    href={`/admin/contacts/${contact.contactId}`}
                                                    className={styles.actionButton}
                                                >
                                                    詳細
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ページネーション */}
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                {total} 件中 {(currentPage - 1) * limit + 1} -{' '}
                                {Math.min(currentPage * limit, total)} 件を表示
                            </div>
                            <div className={styles.paginationButtons}>
                                <button
                                    className={styles.paginationButton}
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    前へ
                                </button>
                                <button
                                    className={styles.paginationButton}
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    次へ
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
