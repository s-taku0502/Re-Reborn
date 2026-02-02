// ミッションの型定義
export interface Mission {
    id: string;
    text: string;
    category: 'move' | 'photo' | 'action' | 'observe';
    difficulty: number;
    source: 'master' | 'ai_generated' | 'friend_log' | 'fallback';
    tags?: string[];
    risk_level?: 'low' | 'medium';
}

// ユーザーログの型定義
export interface UserLog {
    id?: string;
    userId: string;
    missionText: string;
    missionId: string;
    imageUrl?: string;
    imageData?: string; // Base64 encoded image for local storage
    location?: {
        name: string;
        latitude?: number;
        longitude?: number;
    };
    memo?: string;
    isPublic: boolean;
    status?: 'completed' | 'cancelled'; // ミッションのステータス（完了 or キャンセル）
    createdAt: Date | string;
}

// ユーザー情報の型定義
export interface User {
    userId: string;
    createdAt: Date | string;
    lastLoginAt?: Date | string;
    totalAdventures: number;
}

// バックアップデータの型定義
export interface BackupData {
    userId: string;
    hashedPassword: string;
    failureCount: number;
    lockUntil?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
