/**
 * 統計関連のFirestore操作
 */

import { getAdminDb } from './admin-firestore';
import { Timestamp } from 'firebase-admin/firestore';

export interface DailyStats {
    date: string; // YYYY-MM-DD
    newUsers: number;
    newWalkingLogs: number;
    totalDistanceWalked: number; // meters
    newContacts: number;
    contactsResolved: number;
    totalDistance: number;
}

export interface MonthlyStats {
    month: string; // YYYY-MM
    newUsers: number;
    activeUsers: number;
    totalWalkingLogs: number;
    totalDistanceWalked: number; // meters
    averageWalkDistance: number; // meters
    newContacts: number;
    contactsResolved: number;
}

/**
 * 指定日付の統計を取得
 */
export async function getDailyStats(date: Date): Promise<DailyStats> {
    const db = getAdminDb();

    // その日の開始と終了の時刻
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // 新規ユーザー
    const newUsersSnapshot = await db
        .collection('users')
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<', dayEnd)
        .get();
    const newUsers = newUsersSnapshot.size;

    // 散歩記録
    const logsSnapshot = await db
        .collection('logs')
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<', dayEnd)
        .get();
    const newWalkingLogs = logsSnapshot.size;

    let totalDistanceWalked = 0;
    logsSnapshot.forEach((doc) => {
        const distance = doc.data().distance || 0;
        totalDistanceWalked += distance;
    });

    // お問い合わせ（新規）
    const newContactsSnapshot = await db
        .collection('contacts')
        .where('createdAt', '>=', dayStart)
        .where('createdAt', '<', dayEnd)
        .get();
    const newContacts = newContactsSnapshot.size;

    // お問い合わせ（解決）- 複合インデックス不要にするため、メモリでフィルタリング
    const resolvedContactsSnapshot = await db
        .collection('contacts')
        .where('status', '==', 'resolved')
        .get();
    
    const contactsResolved = resolvedContactsSnapshot.docs.filter((doc) => {
        const updatedAt = doc.data().updatedAt;
        if (!updatedAt) return false;
        const updatedDate = updatedAt.toDate();
        return updatedDate >= dayStart && updatedDate < dayEnd;
    }).length;

    return {
        date: dayStart.toISOString().split('T')[0],
        newUsers,
        newWalkingLogs,
        totalDistanceWalked,
        newContacts,
        contactsResolved,
        totalDistance: totalDistanceWalked, // 互換性のため
    };
}

/**
 * 全期間の日次統計を取得（直近N日間）
 */
export async function getDailyStatsRange(days: number = 30): Promise<DailyStats[]> {
    const stats: DailyStats[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const dayStat = await getDailyStats(date);
        stats.push(dayStat);
    }

    return stats;
}

/**
 * 月間統計を取得
 */
export async function getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const db = getAdminDb();

    // その月の開始と終了
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    // 新規ユーザー
    const newUsersSnapshot = await db
        .collection('users')
        .where('createdAt', '>=', monthStart)
        .where('createdAt', '<', monthEnd)
        .get();
    const newUsers = newUsersSnapshot.size;

    // アクティブユーザー（その月にログインした）
    const activeUsersSnapshot = await db
        .collection('users')
        .where('lastLoginAt', '>=', monthStart)
        .where('lastLoginAt', '<', monthEnd)
        .get();
    const activeUsers = activeUsersSnapshot.size;

    // 散歩記録
    const logsSnapshot = await db
        .collection('logs')
        .where('createdAt', '>=', monthStart)
        .where('createdAt', '<', monthEnd)
        .get();
    const totalWalkingLogs = logsSnapshot.size;

    let totalDistanceWalked = 0;
    logsSnapshot.forEach((doc) => {
        const distance = doc.data().distance || 0;
        totalDistanceWalked += distance;
    });

    const averageWalkDistance = totalWalkingLogs > 0 ? totalDistanceWalked / totalWalkingLogs : 0;

    // お問い合わせ（新規）
    const newContactsSnapshot = await db
        .collection('contacts')
        .where('createdAt', '>=', monthStart)
        .where('createdAt', '<', monthEnd)
        .get();
    const newContacts = newContactsSnapshot.size;

    // お問い合わせ（解決）- 複合インデックス不要にするため、メモリでフィルタリング
    const resolvedContactsSnapshot = await db
        .collection('contacts')
        .where('status', '==', 'resolved')
        .get();
    
    const contactsResolved = resolvedContactsSnapshot.docs.filter((doc) => {
        const updatedAt = doc.data().updatedAt;
        if (!updatedAt) return false;
        const updatedDate = updatedAt.toDate();
        return updatedDate >= monthStart && updatedDate < monthEnd;
    }).length;

    return {
        month: `${year}-${String(month).padStart(2, '0')}`,
        newUsers,
        activeUsers,
        totalWalkingLogs,
        totalDistanceWalked,
        averageWalkDistance,
        newContacts,
        contactsResolved,
    };
}

/**
 * 全期間の月次統計を取得（直近N月間）
 */
export async function getMonthlyStatsRange(months: number = 12): Promise<MonthlyStats[]> {
    const stats: MonthlyStats[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const monthlyStat = await getMonthlyStats(date.getFullYear(), date.getMonth() + 1);
        stats.push(monthlyStat);
    }

    return stats;
}

/**
 * CSVフォーマットで統計データを生成
 */
export function generateDailyStatsCSV(stats: DailyStats[]): string {
    const headers = ['日付', '新規ユーザー', '散歩記録数', '総距離(m)', 'お問い合わせ', '解決済み'];
    const rows = stats.map((s) => [
        s.date,
        s.newUsers.toString(),
        s.newWalkingLogs.toString(),
        s.totalDistanceWalked.toString(),
        s.newContacts.toString(),
        s.contactsResolved.toString(),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
}

export function generateMonthlyStatsCSV(stats: MonthlyStats[]): string {
    const headers = [
        '月',
        '新規ユーザー',
        'アクティブユーザー',
        '散歩記録数',
        '総距離(m)',
        '平均距離(m)',
        'お問い合わせ',
        '解決済み',
    ];
    const rows = stats.map((s) => [
        s.month,
        s.newUsers.toString(),
        s.activeUsers.toString(),
        s.totalWalkingLogs.toString(),
        s.totalDistanceWalked.toString(),
        Math.round(s.averageWalkDistance).toString(),
        s.newContacts.toString(),
        s.contactsResolved.toString(),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
}
