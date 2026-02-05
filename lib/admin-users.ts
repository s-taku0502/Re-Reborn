/**
 * ユーザー管理関連のFirestore操作
 */

import { getAdminDb } from './admin-firestore';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminDb();

export interface User {
    userId: string;
    email: string;
    username: string;
    createdAt: Timestamp;
    updatedAt: Timestamp | null;
    lastLoginAt: Timestamp | null;
    totalWalks: number;
    totalDistance: number; // メートル単位
    totalDuration: number; // 分単位
    profileImageUrl: string | null;
    isActive: boolean;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
}

/**
 * ユーザー一覧を取得（ページネーション付き）
 */
export async function getUsers(
    limit: number = 25,
    offset: number = 0,
    searchQuery?: string
): Promise<{ users: User[]; total: number }> {
    try {
        let query = db.collection('users').orderBy('createdAt', 'desc');

        // 検索クエリがある場合（メールアドレスまたはユーザー名）
        if (searchQuery) {
            // Firestoreの制限により、完全一致または前方一致のみ対応
            query = query
                .where('email', '>=', searchQuery)
                .where('email', '<=', searchQuery + '\uf8ff');
        }

        // 総数を取得
        const totalSnapshot = await query.get();
        const total = totalSnapshot.size;

        // ページネーション
        const snapshot = await query.limit(limit).offset(offset).get();

        const users: User[] = [];
        snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            users.push({
                userId: doc.id,
                ...doc.data(),
            } as User);
        });

        return { users, total };
    } catch (error) {
        console.error('[Admin Users] Error getting users:', error);
        throw error;
    }
}

/**
 * ユーザーIDでユーザーを取得
 */
export async function getUserById(userId: string): Promise<User | null> {
    try {
        const doc = await db.collection('users').doc(userId).get();

        if (!doc.exists) {
            return null;
        }

        return {
            userId: doc.id,
            ...doc.data(),
        } as User;
    } catch (error) {
        console.error('[Admin Users] Error getting user by ID:', error);
        throw error;
    }
}

/**
 * ユーザーを削除
 */
export async function deleteUser(userId: string): Promise<void> {
    try {
        // ユーザーの散歩記録も削除
        const logsSnapshot = await db
            .collection('logs')
            .where('userId', '==', userId)
            .get();

        const batch = db.batch();

        // 散歩記録を削除
        logsSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            batch.delete(doc.ref);
        });

        // ユーザーを削除
        batch.delete(db.collection('users').doc(userId));

        await batch.commit();
    } catch (error) {
        console.error('[Admin Users] Error deleting user:', error);
        throw error;
    }
}

/**
 * ユーザーのアクティブ状態を更新
 */
export async function updateUserStatus(
    userId: string,
    isActive: boolean
): Promise<void> {
    try {
        await db.collection('users').doc(userId).update({
            isActive,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('[Admin Users] Error updating user status:', error);
        throw error;
    }
}

/**
 * ユーザー統計を取得
 */
export async function getUserStats(): Promise<UserStats> {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // DateをFirestore Timestampに変換
        const todayStartTimestamp = Timestamp.fromDate(todayStart);
        const weekStartTimestamp = Timestamp.fromDate(weekStart);
        const monthStartTimestamp = Timestamp.fromDate(monthStart);

        // 総ユーザー数
        const totalSnapshot = await db.collection('users').get();
        const totalUsers = totalSnapshot.size;

        // アクティブユーザー数
        const activeSnapshot = await db
            .collection('users')
            .where('isActive', '==', true)
            .get();
        const activeUsers = activeSnapshot.size;

        // 今日の新規ユーザー
        const todaySnapshot = await db
            .collection('users')
            .where('createdAt', '>=', todayStartTimestamp)
            .get();
        const newUsersToday = todaySnapshot.size;

        // 今週の新規ユーザー
        const weekSnapshot = await db
            .collection('users')
            .where('createdAt', '>=', weekStartTimestamp)
            .get();
        const newUsersThisWeek = weekSnapshot.size;

        // 今月の新規ユーザー
        const monthSnapshot = await db
            .collection('users')
            .where('createdAt', '>=', monthStartTimestamp)
            .get();
        const newUsersThisMonth = monthSnapshot.size;

        return {
            totalUsers,
            activeUsers,
            newUsersToday,
            newUsersThisWeek,
            newUsersThisMonth,
        };
    } catch (error) {
        console.error('[Admin Users] Error getting user stats:', error);
        throw error;
    }
}

/**
 * ユーザーの散歩記録一覧を取得
 */
export async function getUserLogs(
    userId: string,
    limit: number = 10
): Promise<any[]> {
    try {
        const snapshot = await db
            .collection('logs')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const logs: any[] = [];
        snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            logs.push({
                logId: doc.id,
                ...doc.data(),
            });
        });

        return logs;
    } catch (error) {
        console.error('[Admin Users] Error getting user logs:', error);
        throw error;
    }
}
