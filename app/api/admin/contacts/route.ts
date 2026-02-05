import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/admin-jwt';
import { findAdminById } from '@/lib/admin-firestore';
import { getContacts, getContactsStats } from '@/lib/admin-contacts';

/**
 * GET /api/admin/contacts
 * お問い合わせ一覧を取得
 */
export async function GET(request: NextRequest) {
    try {
        // 認証チェック
        const authHeader = request.headers.get('Authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Missing authorization header' },
                { status: 401 }
            );
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // 管理者の確認
        const admin = await findAdminById(payload.adminId);
        if (!admin || !admin.isActive) {
            return NextResponse.json(
                { success: false, error: 'Admin not found or inactive' },
                { status: 401 }
            );
        }

        // 権限チェック（admin以上）
        if (admin.role === 'moderator') {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // クエリパラメータを取得
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const limit = parseInt(searchParams.get('limit') || '25', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        // お問い合わせを取得
        const { contacts, total } = await getContacts(status, limit, offset);

        // Timestamp を ISO8601 文字列に変換
        const contactsFormatted = contacts.map((contact) => ({
            contactId: contact.contactId,
            name: contact.name,
            email: contact.email,
            subject: contact.subject,
            message: contact.message,
            status: contact.status,
            createdAt: contact.createdAt.toDate().toISOString(),
            updatedAt: contact.updatedAt ? contact.updatedAt.toDate().toISOString() : null,
            readAt: contact.readAt ? contact.readAt.toDate().toISOString() : null,
            userAgent: contact.userAgent,
            ip: contact.ip,
            adminNote: contact.adminNote,
            assignedTo: contact.assignedTo,
        }));

        return NextResponse.json(
            {
                success: true,
                contacts: contactsFormatted,
                total,
                limit,
                offset,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[Admin Contacts] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
