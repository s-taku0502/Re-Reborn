/**
 * ユーザー詳細API
 * GET /api/admin/users/[id] - ユーザー詳細を取得
 * PATCH /api/admin/users/[id] - ユーザー情報を更新
 * DELETE /api/admin/users/[id] - ユーザーを削除（管理者・スーパー管理者のみ）
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById, recordAuditLog } from '@/lib/admin-firestore';
import { getUserById, deleteUser, updateUserStatus, getUserLogs } from '@/lib/admin-users';

/**
 * GET /api/admin/users/[id]
 * ユーザー詳細を取得
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // モデレーターはアクセス不可
    if (admin.role === 'moderator') {
      return NextResponse.json(
        { success: false, error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    // ユーザーを取得
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 最近の散歩記録を取得
    const recentLogs = await getUserLogs(params.id, 10);

    // Timestampを文字列に変換
    const userResponse = {
      ...user,
      createdAt: user.createdAt.toDate().toISOString(),
      updatedAt: user.updatedAt ? user.updatedAt.toDate().toISOString() : null,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toDate().toISOString() : null,
    };

    const logsResponse = recentLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt?.toDate().toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      user: userResponse,
      recentLogs: logsResponse,
    });
  } catch (error) {
    console.error('[Admin Users API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'ユーザー詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * ユーザー情報を更新
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // モデレーターはアクセス不可
    if (admin.role === 'moderator') {
      return NextResponse.json(
        { success: false, error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    // ユーザーの存在確認
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // リクエストボディを取得
    const body = await req.json();

    // アクティブ状態の更新のみ対応
    if (body.isActive !== undefined) {
      await updateUserStatus(params.id, body.isActive);

      // 監査ログ記録
      await recordAuditLog(
        admin.adminId,
        'update',
        'user',
        params.id,
        {
          before: { isActive: user.isActive },
          after: { isActive: body.isActive },
        },
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        req.headers.get('user-agent') || 'unknown'
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ユーザー情報を更新しました',
    });
  } catch (error) {
    console.error('[Admin Users API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'ユーザー情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * ユーザーを削除（管理者・スーパー管理者のみ）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 管理者・スーパー管理者のみ
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'アクセス権限がありません' },
        { status: 403 }
      );
    }

    // ユーザーの存在確認
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーを削除
    await deleteUser(params.id);

    // 監査ログ記録
    await recordAuditLog(
      admin.adminId,
      'delete',
      'user',
      params.id,
      {
        before: {
          email: user.email,
          username: user.username,
        },
        after: null,
      },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      message: 'ユーザーを削除しました',
    });
  } catch (error) {
    console.error('[Admin Users API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
}
