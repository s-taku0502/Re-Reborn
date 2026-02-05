import { NextRequest, NextResponse } from 'next/server';
import { findAdminByEmail, recordLoginFailure, recordLoginSuccess } from '@/lib/admin-firestore';
import { verifyPassword } from '@/lib/password';
import { generateToken } from '@/lib/admin-jwt';

/**
 * POST /api/admin/auth/login
 * 管理者ログイン
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 入力値の検証
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // Email 形式の検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 422 }
      );
    }

    // メールアドレスで管理者を検索
    const admin = await findAdminByEmail(email);
    if (!admin) {
      console.warn(`[Admin Login] User not found: ${email}`);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // アカウントがアクティブか確認
    if (!admin.isActive) {
      console.warn(`[Admin Login] Inactive account: ${email}`);
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // ロック中か確認
    const now = Date.now();
    if (
      admin.loginAttempts?.lockedUntil &&
      admin.loginAttempts.lockedUntil.toMillis() > now
    ) {
      const remainingMinutes = Math.ceil(
        (admin.loginAttempts.lockedUntil.toMillis() - now) / 1000 / 60
      );
      console.warn(
        `[Admin Login] Account locked: ${email} (${remainingMinutes} minutes remaining)`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Account is locked. Please try again in ${remainingMinutes} minutes.`,
        },
        { status: 423 }
      );
    }

    // パスワードの検証
    const isPasswordValid = await verifyPassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      // ログイン失敗を記録
      const isLocked = await recordLoginFailure(admin.adminId);

      if (isLocked) {
        console.warn(`[Admin Login] Account locked due to failed attempts: ${email}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed attempts. Account is locked for 15 minutes.',
          },
          { status: 423 }
        );
      }

      console.warn(`[Admin Login] Invalid password: ${email}`);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ログイン成功を記録
    await recordLoginSuccess(admin.adminId);

    // JWT トークンを生成
    const token = generateToken({
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
    });

    console.info(`[Admin Login] Successful: ${email} (${admin.role})`);

    // レスポンスに Set-Cookie も追加（オプション）
    const response = NextResponse.json(
      {
        success: true,
        adminId: admin.adminId,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        token,
        expiresIn: 8 * 60 * 60, // 8時間（秒単位）
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);

    const isDev = process.env.NODE_ENV !== 'production';
    const detail =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error) };

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        ...(isDev ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
