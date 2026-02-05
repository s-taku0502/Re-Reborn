'use client';

import { useState, useEffect } from 'react';
import styles from './manage-admins.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

interface Admin {
    adminId: string;
    email: string;
    displayName: string;
    role: 'superadmin' | 'admin' | 'moderator';
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    createdBy?: string;
}

export default function ManageAdminsPage() {
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // モーダル
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'admin' as 'superadmin' | 'admin' | 'moderator',
    });

    // 管理者一覧を取得
    const fetchAdmins = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const response = await fetch('/api/admin/manage-admins', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('管理者一覧の取得に失敗しました');
            }

            const data = await response.json();
            setAdmins(data.admins);
        } catch (err) {
            console.error('[Manage Admins] Error fetching admins:', err);
            setError('管理者一覧の取得中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading || !admin) return;
        fetchAdmins();
    }, [admin, authLoading]);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            setError(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const response = await fetch('/api/admin/manage-admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newAdmin),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '管理者の作成に失敗しました');
            }

            setSuccessMessage('管理者を作成しました');
            setShowAddModal(false);
            setNewAdmin({
                email: '',
                password: '',
                displayName: '',
                role: 'admin',
            });

            // リストを再取得
            fetchAdmins();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error('[Manage Admins] Error adding admin:', err);
            setError(err.message || '管理者の作成中にエラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (adminId: string) => {
        if (!confirm('この管理者を削除してもよろしいですか？')) {
            return;
        }

        try {
            setError(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const response = await fetch(`/api/admin/manage-admins/${adminId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '管理者の削除に失敗しました');
            }

            setSuccessMessage('管理者を削除しました');

            // リストを再取得
            fetchAdmins();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error('[Manage Admins] Error deleting admin:', err);
            setError(err.message || '管理者の削除中にエラーが発生しました');
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'スーパー管理者';
            case 'admin':
                return '管理者';
            case 'moderator':
                return 'モデレーター';
            default:
                return role;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
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

    return (
        <ProtectedAdminRoute>
            <div className={styles.manageContainer}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.title}>🔐 管理者アカウント管理</h1>
                        <button
                            className={styles.addButton}
                            onClick={() => setShowAddModal(true)}
                        >
                            ➕ 管理者を追加
                        </button>
                    </div>
                    <p className={styles.subtitle}>
                        管理者アカウントの作成・編集・削除を行います（スーパー管理者のみ）
                    </p>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

                {/* 管理者テーブル */}
                <div className={styles.tableContainer}>
                    {admins.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>👥 管理者が見つかりません</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>管理者情報</th>
                                    <th>ロール</th>
                                    <th>ステータス</th>
                                    <th>作成日</th>
                                    <th>最終ログイン</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((adm) => (
                                    <tr key={adm.adminId}>
                                        <td>
                                            <div className={styles.adminInfo}>
                                                <span className={styles.adminName}>{adm.displayName}</span>
                                                <span className={styles.adminEmail}>{adm.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`${styles.roleBadge} ${adm.role === 'superadmin'
                                                        ? styles.roleSuperadmin
                                                        : adm.role === 'admin'
                                                            ? styles.roleAdmin
                                                            : styles.roleModerator
                                                    }`}
                                            >
                                                {getRoleLabel(adm.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`${styles.statusBadge} ${adm.isActive ? styles.statusActive : styles.statusInactive
                                                    }`}
                                            >
                                                {adm.isActive ? 'アクティブ' : '無効'}
                                            </span>
                                        </td>
                                        <td>{formatDate(adm.createdAt)}</td>
                                        <td>{formatDate(adm.lastLoginAt)}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.deleteButton}
                                                    onClick={() => handleDeleteAdmin(adm.adminId)}
                                                    disabled={adm.adminId === admin?.adminId}
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 追加モーダル */}
                {showAddModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>➕ 管理者を追加</h2>
                            </div>

                            <form onSubmit={handleAddAdmin}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>メールアドレス</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        value={newAdmin.email}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>表示名</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={newAdmin.displayName}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, displayName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>パスワード（7桁の数字）</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        placeholder="1234567"
                                        pattern="\d{7}"
                                        maxLength={7}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>ロール</label>
                                    <select
                                        className={styles.select}
                                        value={newAdmin.role}
                                        onChange={(e) =>
                                            setNewAdmin({
                                                ...newAdmin,
                                                role: e.target.value as 'superadmin' | 'admin' | 'moderator',
                                            })
                                        }
                                    >
                                        <option value="admin">管理者</option>
                                        <option value="moderator">モデレーター</option>
                                        <option value="superadmin">スーパー管理者</option>
                                    </select>
                                </div>

                                <div className={styles.modalActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? '作成中...' : '作成'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedAdminRoute>
    );
}
