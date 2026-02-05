import { NextRequest, NextResponse } from 'next/server';
import { createAdmin, hasSuperAdmin } from '@/lib/admin-firestore';
import { generateRandomPassword } from '@/lib/password';

/**
 * POST /api/admin/setup
 * 初期 superadmin アカウントの作成（1回限り）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, setupToken } = body;

    // 入力値の検証
    if (!email || !password || !displayName || !setupToken) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // パスワード形式の検証（7桁の数字）
    if (!/^\d{7}$/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be 7 digits' },
        { status: 422 }
      );
    }

    // setupToken の検証
    const expectedToken = process.env.ADMIN_SETUP_TOKEN;
    if (!expectedToken || setupToken !== expectedToken) {
      console.warn('[Admin Setup] Invalid setup token attempted');
      return NextResponse.json(
        { success: false, error: 'Invalid setup token' },
        { status: 400 }
      );
    }

    // superadmin が既に存在するか確認
    const hasSuperAdminAlready = await hasSuperAdmin();
    if (hasSuperAdminAlready) {
      console.warn('[Admin Setup] Superadmin already exists, initialization blocked');
      return NextResponse.json(
        { success: false, error: 'Superadmin already exists' },
        { status: 409 }
      );
    }

    // 初期 superadmin を作成
    const adminId = await createAdmin(
      email,
      displayName,
      password,
      'superadmin'
    );

    console.info(`[Admin Setup] Superadmin created: ${adminId}`);

    return NextResponse.json(
      {
        success: true,
        adminId,
        role: 'superadmin',
        message: 'Initial superadmin created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Setup] Error:', error);

    if (error instanceof Error && error.message.includes('Email already exists')) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
