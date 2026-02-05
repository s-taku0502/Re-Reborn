'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './detail.module.css';
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
    userAgent: string;
    ip: string;
    adminNote: string | null;
    assignedTo: string | null;
}

export default function ContactDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [contact, setContact] = useState<Contact | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 編集用の状態
    const [status, setStatus] = useState<string>('new');
    const [adminNote, setAdminNote] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // お問い合わせ詳細を取得
    useEffect(() => {
        if (authLoading || !admin) return;

        const fetchContact = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const token = getTokenFromStorage();
                if (!token) {
                    setError('認証トークンがありません');
                    return;
                }

                const response = await fetch(`/api/admin/contacts/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('お問い合わせが見つかりません');
                    } else {
                        setError('お問い合わせの取得に失敗しました');
                    }
                    return;
                }

                const data = await response.json();
                setContact(data.contact);
                setStatus(data.contact.status);
                setAdminNote(data.contact.adminNote || '');
            } catch (err) {
                console.error('[Contact Detail] Error fetching contact:', err);
                setError('お問い合わせの取得中にエラーが発生しました');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContact();
    }, [params.id, admin, authLoading]);

    const handleSave = async () => {
        if (!contact) return;

        try {
            setIsSaving(true);
            setError(null);
            setSuccessMessage(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const response = await fetch(`/api/admin/contacts/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    adminNote,
                }),
            });

            if (!response.ok) {
                throw new Error('更新に失敗しました');
            }

            setSuccessMessage('保存しました');

            // 最新情報を再取得
            const updatedResponse = await fetch(`/api/admin/contacts/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (updatedResponse.ok) {
                const data = await updatedResponse.json();
                setContact(data.contact);
            }
        } catch (err) {
            console.error('[Contact Detail] Error saving:', err);
            setError('保存中にエラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!contact) return;

        if (!confirm('このお問い合わせを削除してもよろしいですか？')) {
            return;
        }

        try {
            setError(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const response = await fetch(`/api/admin/contacts/${params.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('削除に失敗しました');
            }

            alert('削除しました');
            router.push('/admin/contacts');
        } catch (err) {
            console.error('[Contact Detail] Error deleting:', err);
            setError('削除中にエラーが発生しました');
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

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (error && !contact) {
        return (
            <ProtectedAdminRoute>
                <div className={styles.detailContainer}>
                    <div className={styles.errorMessage}>{error}</div>
                    <Link href="/admin/contacts" className={styles.backButton}>
                        ← 一覧に戻る
                    </Link>
                </div>
            </ProtectedAdminRoute>
        );
    }

    if (!contact) {
        return null;
    }

    return (
        <ProtectedAdminRoute>
            <div className={styles.detailContainer}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>💬 お問い合わせ詳細</h1>
                        <Link href="/admin/contacts" className={styles.backButton}>
                            ← 一覧に戻る
                        </Link>
                    </div>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

                <div className={styles.contentGrid}>
                    <div className={styles.mainContent}>
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>📄 お問い合わせ内容</h2>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>件名</span>
                                <span className={styles.infoValue}>{contact.subject}</span>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <p className={styles.messageContent}>{contact.message}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>👤 送信者情報</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>名前</span>
                                <span className={styles.infoValue}>{contact.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>メール</span>
                                <span className={styles.infoValue}>{contact.email}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>送信日時</span>
                                <span className={styles.infoValue}>{formatDate(contact.createdAt)}</span>
                            </div>
                            {contact.updatedAt && (
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>更新日時</span>
                                    <span className={styles.infoValue}>{formatDate(contact.updatedAt)}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>⚙️ ステータス管理</h3>
                            <select
                                className={styles.statusSelect}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="new">新規</option>
                                <option value="read">既読</option>
                                <option value="inProgress">対応中</option>
                                <option value="resolved">解決済み</option>
                                <option value="closed">完了</option>
                            </select>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>📝 管理者メモ</h3>
                            <textarea
                                className={styles.noteTextarea}
                                placeholder="内部メモを入力..."
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                            />
                            <button
                                className={styles.saveButton}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? '保存中...' : '保存'}
                            </button>
                        </div>

                        {admin?.role === 'superadmin' && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>🗑️ 削除</h3>
                                <button className={styles.deleteButton} onClick={handleDelete}>
                                    お問い合わせを削除
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedAdminRoute>
    );
}
