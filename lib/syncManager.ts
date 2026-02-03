// オフライン同期マネージャー
// localStorage の未同期データを Firestore に同期

import { saveLogToFirestore } from './firestore';
import { UserLog } from './types';
import { getErrorMessage } from './errorHandler';

interface SyncQueueItem {
    type: 'log';
    data: UserLog;
    timestamp: number;
}

const SYNC_QUEUE_KEY = 'michikusa_memory_sync_queue';

/**
 * 同期キューにログを追加
 */
export function addToSyncQueue(log: UserLog): void {
    try {
        const queueString = localStorage.getItem(SYNC_QUEUE_KEY) || '[]';
        const queue: SyncQueueItem[] = JSON.parse(queueString);

        queue.push({
            type: 'log',
            data: log,
            timestamp: Date.now(),
        });

        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
        console.error('Failed to add to sync queue:', error);
    }
}

/**
 * 同期キューを取得
 */
export function getSyncQueue(): SyncQueueItem[] {
    try {
        const queueString = localStorage.getItem(SYNC_QUEUE_KEY) || '[]';
        return JSON.parse(queueString);
    } catch (error) {
        console.error('Failed to get sync queue:', error);
        return [];
    }
}

/**
 * 同期キューをクリア
 */
export function clearSyncQueue(): void {
    try {
        localStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (error) {
        console.error('Failed to clear sync queue:', error);
    }
}

/**
 * 未同期データを Firestore に同期
 */
export async function syncPendingData(): Promise<{ success: number; failed: number }> {
    const queue = getSyncQueue();

    if (queue.length === 0) {
        return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of queue) {
        try {
            if (item.type === 'log') {
                await saveLogToFirestore(item.data.userId, item.data);
                successCount++;
            }
        } catch (error) {
            console.error('Failed to sync item:', error);
            failedCount++;
            // 失敗した項目はキューに残す
            remainingQueue.push(item);
        }
    }

    // 失敗した項目のみをキューに保存
    if (remainingQueue.length > 0) {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
    } else {
        clearSyncQueue();
    }

    return { success: successCount, failed: failedCount };
}

/**
 * オフライン状態で保存されたログを Firestore に同期
 */
export async function syncOfflineLogs(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) {
        console.log('App is offline. Sync will be deferred.');
        return;
    }

    try {
        const result = await syncPendingData();

        if (result.success > 0) {
            console.log(`Successfully synced ${result.success} items`);
        }

        if (result.failed > 0) {
            console.warn(`Failed to sync ${result.failed} items. Will retry later.`);
        }
    } catch (error) {
        const message = getErrorMessage(error);
        console.error(`Sync failed: ${message}`);
    }
}

/**
 * 自動同期セットアップ（オンライン復帰時に実行）
 */
export function setupAutoSync(userId: string): () => void {
    if (typeof window === 'undefined') return () => { };

    const handleOnline = () => {
        console.log('Network restored. Starting auto-sync...');
        syncOfflineLogs(userId);
    };

    window.addEventListener('online', handleOnline);

    // 初回同期を実行
    if (navigator.onLine) {
        syncOfflineLogs(userId);
    }

    // クリーンアップ関数を返す
    return () => {
        window.removeEventListener('online', handleOnline);
    };
}

/**
 * 同期ステータスを取得
 */
export function getSyncStatus(): {
    hasPendingSync: boolean;
    pendingCount: number;
    oldestTimestamp: number | null;
} {
    const queue = getSyncQueue();

    return {
        hasPendingSync: queue.length > 0,
        pendingCount: queue.length,
        oldestTimestamp: queue.length > 0 ? queue[0].timestamp : null,
    };
}
