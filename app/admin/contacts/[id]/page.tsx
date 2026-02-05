'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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

const statusLabels: Record<Contact['status'], string> = {
    new: '未読',
    read: '既読',
    inProgress: '対応中',
    resolved: '解決済み',
    closed: 'クローズ',
};

const statusClassMap: Record<Contact['status'], string> = {
    new: styles.statusNew,
    read: styles.statusRead,
    inProgress: styles.statusInProgress,
    resolved: styles.statusResolved,
    closed: styles.statusClosed,
};

export default function ContactDetailPage() {
    const router = useRouter();
    const { admin, isLoading: authLoading } = useAdminAuth();
    const params = useParams() as { id: string };
    const [contact, setContact] = useState<Contact | null>(null);
    const [status, setStatus] = useState<Contact['status']>('new');
    const [adminNote, setAdminNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const canDelete = admin?.role === 'superadmin';

    const formattedDates = useMemo(() => {
        if (!contact) {
            return {
                createdAt: '- ',
                updatedAt: '- ',
                readAt: '- ',
            };
        }

        const format = (value: string | null) =>
            value ? new Date(value).toLocaleString('ja-JP') : '-';

        return {
            createdAt: format(contact.createdAt),
            updatedAt: format(contact.updatedAt),
            readAt: format(contact.readAt),
        };
    }, [contact]);

    useEffect(() => {
        if (authLoading || !admin) return;

        const fetchContact = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setSuccess(null);

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
                    throw new Error('お問い合わせの取得に失敗しました');
                }

                const data = await response.json();
                setContact(data.contact);
                setStatus(data.contact.status);
                setAdminNote(data.contact.adminNote ?? '');
            } catch (fetchError) {
                console.error('[Admin Contact Detail] Error:', fetchError);
                setError('お問い合わせの取得中にエラーが発生しました');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContact();
    }, [admin, authLoading, params.id]);

    const handleSave = async () => {
        if (!contact) return;

        try {
            setIsSaving(true);
            setError(null);
            setSuccess(null);

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
                throw new Error('お問い合わせの更新に失敗しました');
            }

            const updatedAt = new Date().toISOString();
            setContact({
                ...contact,
                status,
                adminNote: adminNote || null,
                updatedAt,
            });
            setSuccess('更新しました');
        } catch (saveError) {
            console.error('[Admin Contact Detail] Error:', saveError);
            setError('更新に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!contact || !canDelete) return;

        const confirmed = window.confirm('このお問い合わせを削除しますか？');
        if (!confirmed) return;

        try {
            setIsDeleting(true);
            setError(null);
            setSuccess(null);

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
                throw new Error('お問い合わせの削除に失敗しました');
            }

            router.push('/admin/contacts');
        } catch (deleteError) {
            console.error('[Admin Contact Detail] Error:', deleteError);
            setError('削除に失敗しました');
        } finally {
            setIsDeleting(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (!contact) {
        return (
            <div className={styles.detailContainer}>
                <div className={styles.errorMessage}>お問い合わせが見つかりません</div>
            </div>
        );
    }

    return (
        <ProtectedAdminRoute>
            <div className={styles.detailContainer}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>お問い合わせ詳細</h1>
                        <Link href="/admin/contacts" className={styles.backButton}>
                            一覧に戻る
                        </Link>
                    </div>
                    <span className={`${styles.statusBadge} ${statusClassMap[contact.status]}`}>
                        {statusLabels[contact.status]}
                    </span>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}

                <div className={styles.contentGrid}>
                    <div className={styles.mainContent}>
                        <h2 className={styles.sectionTitle}>{contact.subject}</h2>
                        <div className={styles.messageContent}>{contact.message}</div>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>対応状況</h3>
                            <select
                                className={styles.statusSelect}
                                value={status}
                                onChange={(event) => setStatus(event.target.value as Contact['status'])}
                            >
                                {Object.entries(statusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            <textarea
                                className={styles.noteTextarea}
                                value={adminNote}
                                onChange={(event) => setAdminNote(event.target.value)}
                                placeholder="対応メモを入力..."
                            />

                            <button
                                className={styles.saveButton}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? '保存中...' : '更新する'}
                            </button>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>お問い合わせ情報</h3>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>お名前</span>
                                <span className={styles.infoValue}>{contact.name}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>メール</span>
                                <span className={styles.infoValue}>{contact.email}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>受信日時</span>
                                <span className={styles.infoValue}>{formattedDates.createdAt}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>更新日時</span>
                                <span className={styles.infoValue}>{formattedDates.updatedAt}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>既読日時</span>
                                <span className={styles.infoValue}>{formattedDates.readAt}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>IP</span>
                                <span className={styles.infoValue}>{contact.ip || '-'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>User-Agent</span>
                                <span className={styles.infoValue}>{contact.userAgent || '-'}</span>
                            </div>
                        </div>

                        {canDelete && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>削除</h3>
                                <button
                                    className={styles.deleteButton}
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? '削除中...' : 'お問い合わせを削除'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedAdminRoute>
    );
}
