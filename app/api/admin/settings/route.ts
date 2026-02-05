/**
 * システム設定API
 * GET /api/admin/settings - システム設定を取得
 * PATCH /api/admin/settings - システム設定を更新（スーパー管理者のみ）
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import {
    getSystemSettings,
    initializeSystemSettings,
    updateSystemSettings,
    SystemSettings,
} from '@/lib/admin-settings';
import { recordAuditLog } from '@/lib/admin-firestore';

/**
 * GET /api/admin/settings
 * システム設定を取得
 */
export async function GET(req: NextRequest) {
    try {
        // 認証チェック
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: '認証が必要です' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(authHeader.replace('Bearer ', ''));
        if (!decoded) {
            return NextResponse.json(
                { success: false, error: '無効なトークンです' },
                { status: 401 }
            );
        }

        // 管理者存在チェック
        const admin = await findAdminById(decoded.adminId);
        if (!admin || !admin.isActive) {
            return NextResponse.json(
                { success: false, error: '管理者が見つかりません' },
                { status: 404 }
            );
        }

        // スーパー管理者のみアクセス可能
        if (admin.role !== 'superadmin') {
            return NextResponse.json(
                { success: false, error: 'アクセス権限がありません' },
                { status: 403 }
            );
        }

        // 設定を取得（存在しない場合は初期化）
        let settings = await getSystemSettings();
        if (!settings) {
            settings = await initializeSystemSettings();
        }

        // Timestampを文字列に変換
        const settingsResponse = {
            ...settings,
            updatedAt: settings.updatedAt.toDate().toISOString(),
        };

        return NextResponse.json({
            success: true,
            settings: settingsResponse,
        });
    } catch (error) {
        console.error('[Admin Settings API] GET error:', error);
        return NextResponse.json(
            { success: false, error: 'システム設定の取得に失敗しました' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/settings
 * システム設定を更新（スーパー管理者のみ）
 */
export async function PATCH(req: NextRequest) {
    try {
        // 認証チェック
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: '認証が必要です' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(authHeader.replace('Bearer ', ''));
        if (!decoded) {
            return NextResponse.json(
                { success: false, error: '無効なトークンです' },
                { status: 401 }
            );
        }

        // 管理者存在チェック
        const admin = await findAdminById(decoded.adminId);
        if (!admin || !admin.isActive) {
            return NextResponse.json(
                { success: false, error: '管理者が見つかりません' },
                { status: 404 }
            );
        }

        // スーパー管理者のみアクセス可能
        if (admin.role !== 'superadmin') {
            return NextResponse.json(
                { success: false, error: 'アクセス権限がありません' },
                { status: 403 }
            );
        }

        // リクエストボディを取得
        const body = await req.json();

        // バリデーション
        const updates: Partial<Omit<SystemSettings, 'updatedAt' | 'updatedBy'>> = {};

        if (body.maintenanceMode !== undefined) {
            updates.maintenanceMode = {
                enabled: body.maintenanceMode.enabled ?? false,
                message: body.maintenanceMode.message ?? '',
                startDate: body.maintenanceMode.startDate ?? null,
                endDate: body.maintenanceMode.endDate ?? null,
            };
        }

        if (body.features !== undefined) {
            updates.features = {
                walkingLogs: body.features.walkingLogs ?? true,
                oracle: body.features.oracle ?? true,
                album: body.features.album ?? true,
                contact: body.features.contact ?? true,
            };
        }

        if (body.advertising !== undefined) {
            updates.advertising = {
                enabled: body.advertising.enabled ?? false,
                positions: {
                    topPage: body.advertising.positions?.topPage ?? false,
                    recordPage: body.advertising.positions?.recordPage ?? false,
                    oraclePage: body.advertising.positions?.oraclePage ?? false,
                    albumPage: body.advertising.positions?.albumPage ?? false,
                },
                refreshInterval: body.advertising.refreshInterval ?? 30,
            };
        }

        // 設定を更新
        await updateSystemSettings(admin.adminId, updates);

        // 監査ログ記録
    await recordAuditLog(
      admin.adminId,
      'update',
      'settings',
      'system',
      {
        before: {},
        after: Object.keys(updates),
      },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    );
        return NextResponse.json({
            success: true,
            message: 'システム設定を更新しました',
        });
    } catch (error) {
        console.error('[Admin Settings API] PATCH error:', error);
        return NextResponse.json(
            { success: false, error: 'システム設定の更新に失敗しました' },
            { status: 500 }
        );
    }
}
