import { NextRequest, NextResponse } from 'next/server';
import { findAdminById } from '@/lib/admin-firestore';
import { extractTokenFromHeader, verifyToken } from '@/lib/admin-jwt';

/**
 * GET /api/admin/auth/verify
 * JWT トークンを検証
 */
export async function GET(request: NextRequest) {
  try {
    // Authorization ヘッダーを取得
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // トークンを検証
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 管理者の情報を取得（最新状態を確認）
    const admin = await findAdminById(payload.adminId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 401 }
      );
    }

    // アカウントがアクティブか確認
    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      );
    }

    console.info(`[Admin Verify] Success: ${payload.adminId}`);

    return NextResponse.json(
      {
        success: true,
        adminId: admin.adminId,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
