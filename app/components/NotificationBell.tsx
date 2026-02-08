'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import NotificationModal from './NotificationModal';
import styles from './NotificationBell.module.css';

interface Notification {
    id: string;
    type: 'announcement' | 'maintenance' | 'feature';
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high';
    createdAt: string;
}

export default function NotificationBell() {
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // 管理者ページでは非表示
    const isAdminPage = pathname?.startsWith('/admin');

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) return;

            const data = await response.json();
            if (data.success && data.notifications) {
                setNotifications(data.notifications);
                const readIds = getReadNotificationIds();
                const unread = data.notifications.filter((n: Notification) => !readIds.includes(n.id));
                setUnreadCount(unread.length);
            }
        } catch (error) {
            console.error('[NotificationBell] Fetch error:', error);
        }
    }, []);

    useEffect(() => {
        if (!isAdminPage) {
            fetchNotifications();
        }
    }, [isAdminPage, fetchNotifications]);

    const calculateUnreadCount = (notifs: Notification[]) => {
        const readIds = getReadNotificationIds();
        const unread = notifs.filter((n) => !readIds.includes(n.id));
        setUnreadCount(unread.length);
    };

    const getReadNotificationIds = (): string[] => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem('readNotifications');
        return stored ? JSON.parse(stored) : [];
    };

    const markAsRead = (id: string) => {
        if (typeof window === 'undefined') return;
        
        const readIds = getReadNotificationIds();
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem('readNotifications', JSON.stringify(readIds));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = () => {
        if (typeof window === 'undefined') return;
        
        const allIds = notifications.map((n) => n.id);
        localStorage.setItem('readNotifications', JSON.stringify(allIds));
        setUnreadCount(0);
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        markAllAsRead();
    };

    if (isAdminPage || notifications.length === 0) {
        return null;
    }

    return (
        <>
            <button
                className={styles.bellButton}
                onClick={handleOpenModal}
                aria-label="お知らせ"
            >
                🔔
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isModalOpen && (
                <NotificationModal
                    notifications={notifications}
                    onClose={() => setIsModalOpen(false)}
                    getReadIds={getReadNotificationIds}
                    markAsRead={markAsRead}
                />
            )}
        </>
    );
}
