/**
 * システム設定関連のFirestore操作
 */

import { getAdminDb } from './admin-firestore';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminDb();

export interface SystemSettings {
    // メンテナンスモード
    maintenanceMode: {
        enabled: boolean;
        message: string;
        startDate: string | null;
        endDate: string | null;
        blockedPaths: string[];
    };

    // 機能トグル
    features: {
        walkingLogs: boolean;
        oracle: boolean;
        album: boolean;
        contact: boolean;
        sharing: boolean;
    };

    // 広告設定
    advertising: {
        enabled: boolean;
        positions: {
            topPage: boolean;
            recordPage: boolean;
            oraclePage: boolean;
            albumPage: boolean;
        };
        refreshInterval: number; // 秒単位
    };

    // メタ情報
    updatedAt: Timestamp;
    updatedBy: string; // adminId
}

const SETTINGS_DOC_ID = 'system';

/**
 * システム設定を取得
 */
export async function getSystemSettings(): Promise<SystemSettings | null> {
    try {
        const docRef = db.collection('settings').doc(SETTINGS_DOC_ID);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        return doc.data() as SystemSettings;
    } catch (error) {
        console.error('[Admin Settings] Error getting system settings:', error);
        throw error;
    }
}

/**
 * システム設定を初期化（存在しない場合）
 */
export async function initializeSystemSettings(): Promise<SystemSettings> {
    try {
        const existing = await getSystemSettings();
        if (existing) {
            return existing;
        }

        const defaultSettings: Omit<SystemSettings, 'updatedAt' | 'updatedBy'> = {
            maintenanceMode: {
                enabled: false,
                message: 'メンテナンス中です。しばらくお待ちください。',
                startDate: null,
                endDate: null,
                blockedPaths: [],
            },
            features: {
                walkingLogs: true,
                oracle: true,
                album: true,
                contact: true,
                sharing: false,
            },
            advertising: {
                enabled: false,
                positions: {
                    topPage: true,
                    recordPage: false,
                    oraclePage: false,
                    albumPage: false,
                },
                refreshInterval: 30,
            },
        };

        const docRef = db.collection('settings').doc(SETTINGS_DOC_ID);
        await docRef.set({
            ...defaultSettings,
            updatedAt: Timestamp.now(),
            updatedBy: 'system',
        });

        return {
            ...defaultSettings,
            updatedAt: Timestamp.now(),
            updatedBy: 'system',
        } as SystemSettings;
    } catch (error) {
        console.error('[Admin Settings] Error initializing system settings:', error);
        throw error;
    }
}

/**
 * システム設定を更新
 */
export async function updateSystemSettings(
    adminId: string,
    updates: Partial<Omit<SystemSettings, 'updatedAt' | 'updatedBy'>>
): Promise<void> {
    try {
        const docRef = db.collection('settings').doc(SETTINGS_DOC_ID);

        await docRef.update({
            ...updates,
            updatedAt: Timestamp.now(),
            updatedBy: adminId,
        });
    } catch (error) {
        console.error('[Admin Settings] Error updating system settings:', error);
        throw error;
    }
}

/**
 * メンテナンスモードの状態を取得（パブリックAPI用）
 */
export async function getMaintenanceMode(): Promise<{
    enabled: boolean;
    message: string;
    startDate: string | null;
    endDate: string | null;
    blockedPaths: string[];
}> {
    try {
        const settings = await getSystemSettings();

        if (!settings) {
            return {
                enabled: false,
                message: '',
                startDate: null,
                endDate: null,
                blockedPaths: [],
            };
        }

        // 日時チェック（予約メンテナンスの場合）
        const now = new Date();
        let isInMaintenanceWindow = settings.maintenanceMode.enabled;

        if (settings.maintenanceMode.startDate && settings.maintenanceMode.endDate) {
            const parseJstDate = (value: string): Date => {
                const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
                return new Date(hasTimezone ? value : `${value}+09:00`);
            };

            const start = parseJstDate(settings.maintenanceMode.startDate);
            const end = parseJstDate(settings.maintenanceMode.endDate);
            isInMaintenanceWindow = now >= start && now <= end;
        }

        return {
            enabled: isInMaintenanceWindow,
            message: settings.maintenanceMode.message,
            startDate: settings.maintenanceMode.startDate,
            endDate: settings.maintenanceMode.endDate,
            blockedPaths: settings.maintenanceMode.blockedPaths || [],
        };
    } catch (error) {
        console.error('[Admin Settings] Error getting maintenance mode:', error);
        return {
            enabled: false,
            message: '',
            startDate: null,
            endDate: null,
            blockedPaths: [],
        };
    }
}

/**
 * 機能の有効/無効状態を取得（パブリックAPI用）
 */
export async function getFeatureFlags(): Promise<{
    walkingLogs: boolean;
    oracle: boolean;
    album: boolean;
    contact: boolean;
    sharing: boolean;
}> {
    try {
        const settings = await getSystemSettings();

        if (!settings) {
            return {
                walkingLogs: true,
                oracle: true,
                album: true,
                contact: true,
                sharing: false,
            };
        }

        return settings.features;
    } catch (error) {
        console.error('[Admin Settings] Error getting feature flags:', error);
        return {
            walkingLogs: true,
            oracle: true,
            album: true,
            contact: true,
            sharing: false,
        };
    }
}
