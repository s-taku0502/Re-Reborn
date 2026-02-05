/**
 * 管理者アカウント管理API
 * GET /api/admin/manage-admins - 管理者一覧を取得（スーパー管理者のみ）
 * POST /api/admin/manage-admins - 新規管理者を作成（スーパー管理者のみ）
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-jwt';
import { findAdminById, getAllAdmins, createAdmin, recordAuditLog } from '@/lib/admin-firestore';

/**
 * GET /api/admin/manage-admins
 * 管理者一覧を取得（スーパー管理者のみ）
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

    // 全管理者を取得
    const admins = await getAllAdmins();

    // Timestampを文字列に変換し、passwordHashを除外
    const adminsResponse = admins.map((a) => ({
      adminId: a.adminId,
      email: a.email,
      displayName: a.displayName,
      role: a.role,
      isActive: a.isActive,
      createdAt: a.createdAt.toDate().toISOString(),
      lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toDate().toISOString() : null,
      createdBy: a.createdBy,
    }));

    return NextResponse.json({
      success: true,
      admins: adminsResponse,
    });
  } catch (error) {
    console.error('[Admin Manage API] GET error:', error);
    return NextResponse.json(
      { success: false, error: '管理者一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/manage-admins
 * 新規管理者を作成（スーパー管理者のみ）
 */
export async function POST(req: NextRequest) {
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
    if (!body.email || !body.password || !body.displayName || !body.role) {
      return NextResponse.json(
        { success: false, error: '必須項目が不足しています' },
        { status: 422 }
      );
    }

    // パスワードは7桁
    if (body.password.length !== 7 || !/^\d{7}$/.test(body.password)) {
      return NextResponse.json(
        { success: false, error: 'パスワードは7桁の数字である必要があります' },
        { status: 422 }
      );
    }

    // ロールのバリデーション
    if (!['superadmin', 'admin', 'moderator'].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: '無効なロールです' },
        { status: 422 }
      );
    }

    // 管理者を作成
    const newAdminId = await createAdmin(
      body.email,
      body.displayName,
      body.password,
      body.role,
      admin.adminId
    );

    // 監査ログ記録
    await recordAuditLog(
      admin.adminId,
      'create',
      'admin',
      newAdminId,
      {
        before: null,
        after: {
          email: body.email,
          displayName: body.displayName,
          role: body.role,
        },
      },
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      req.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      message: '管理者を作成しました',
      adminId: newAdminId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Manage API] POST error:', error);
    
    if (error.message === 'Email already exists') {
      return NextResponse.json(
        { success: false, error: 'このメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: '管理者の作成に失敗しました' },
      { status: 500 }
    );
  }
}
