'use client';

import { useEffect } from 'react';
import styles from './NotificationModal.module.css';

interface Notification {
    id: string;
    type: 'announcement' | 'maintenance' | 'feature';
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high';
    createdAt: string;
}

interface Props {
    notifications: Notification[];
    onClose: () => void;
    getReadIds: () => string[];
    markAsRead: (id: string) => void;
}

const typeLabels: Record<Notification['type'], { icon: string; label: string; color: string }> = {
    announcement: { icon: '📢', label: 'お知らせ', color: '#3b82f6' },
    maintenance: { icon: '🚧', label: 'メンテナンス', color: '#f59e0b' },
    feature: { icon: '✨', label: '新機能', color: '#10b981' },
};

const priorityColors: Record<Notification['priority'], string> = {
    low: '#6b7280',
    normal: '#3b82f6',
    high: '#ef4444',
};

export default function NotificationModal({ notifications, onClose, getReadIds, markAsRead }: Props) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const readIds = getReadIds();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;

        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>📬 お知らせ</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="閉じる">
                        ✕
                    </button>
                </div>

                <div className={styles.content}>
                    {notifications.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyIcon}>📭</p>
                            <p className={styles.emptyText}>お知らせはありません</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {notifications.map((notification) => {
                                const typeInfo = typeLabels[notification.type];
                                const isUnread = !readIds.includes(notification.id);

                                return (
                                    <div
                                        key={notification.id}
                                        className={`${styles.item} ${isUnread ? styles.unread : ''}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className={styles.itemHeader}>
                                            <div className={styles.typeIcon} style={{ color: typeInfo.color }}>
                                                {typeInfo.icon}
                                            </div>
                                            <span
                                                className={styles.typeLabel}
                                                style={{ backgroundColor: typeInfo.color }}
                                            >
                                                {typeInfo.label}
                                            </span>
                                            {notification.priority === 'high' && (
                                                <span
                                                    className={styles.priorityBadge}
                                                    style={{ color: priorityColors.high }}
                                                >
                                                    重要
                                                </span>
                                            )}
                                            <span className={styles.date}>{formatDate(notification.createdAt)}</span>
                                        </div>
                                        <h3 className={styles.itemTitle}>{notification.title}</h3>
                                        <p className={styles.itemMessage}>{notification.message}</p>
                                        {isUnread && <div className={styles.unreadDot} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
