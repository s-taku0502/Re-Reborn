import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/admin-jwt';
import { findAdminById, recordAuditLog } from '@/lib/admin-firestore';
import {
    getContactById,
    updateContact,
    markContactAsRead,
    deleteContact,
} from '@/lib/admin-contacts';

/**
 * GET /api/admin/contacts/[id]
 * お問い合わせ詳細を取得
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        // お問い合わせを取得
        const contact = await getContactById(id);
        if (!contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            );
        }

        // 'new' ステータスの場合、自動的に 'read' に変更
        if (contact.status === 'new') {
            await markContactAsRead(id);
            contact.status = 'read';
            contact.readAt = new Date() as any;
        }

        // Timestamp を ISO8601 文字列に変換
        const contactFormatted = {
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
        };

        return NextResponse.json(
            {
                success: true,
                contact: contactFormatted,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[Admin Contact Detail] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/contacts/[id]
 * お問い合わせを更新（ステータス変更、メモ追加、担当者割り当て）
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        // リクエストボディを取得
        const body = await request.json();
        const { status, adminNote, assignedTo } = body;

        const { id } = await params;

        // お問い合わせが存在するか確認
        const contact = await getContactById(id);
        if (!contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            );
        }

        // 更新前の状態を記録
        const before = {
            status: contact.status,
            adminNote: contact.adminNote,
            assignedTo: contact.assignedTo,
        };

        // 更新データを構築
        const updateData: any = {};

        if (status && ['new', 'read', 'inProgress', 'resolved', 'closed'].includes(status)) {
            updateData.status = status;
        }

        if (adminNote !== undefined) {
            // 最大1000文字
            if (adminNote && adminNote.length > 1000) {
                return NextResponse.json(
                    { success: false, error: 'Admin note exceeds 1000 characters' },
                    { status: 422 }
                );
            }
            updateData.adminNote = adminNote || null;
        }

        if (assignedTo !== undefined) {
            updateData.assignedTo = assignedTo || null;
        }

        // 更新を実行
        await updateContact(id, updateData);

        // 監査ログに記録
        const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await recordAuditLog(
            admin.adminId,
            'update_contact',
            'contact',
            id,
            {
                before,
                after: updateData,
            },
            ipAddress,
            userAgent
        );

        console.info(
            `[Admin Contact Update] ${admin.adminId} updated contact ${id}`
        );

        return NextResponse.json(
            {
                success: true,
                updatedAt: new Date().toISOString(),
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[Admin Contact Update] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/contacts/[id]
 * お問い合わせを削除（superadminのみ）
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        // 権限チェック（superadminのみ）
        if (admin.role !== 'superadmin') {
            return NextResponse.json(
                { success: false, error: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // お問い合わせが存在するか確認
        const contact = await getContactById(id);
        if (!contact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 }
            );
        }

        // 削除を実行
        await deleteContact(id);

        // 監査ログに記録
        const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await recordAuditLog(
            admin.adminId,
            'delete_contact',
            'contact',
            id,
            {
                before: contact,
                after: null,
            },
            ipAddress,
            userAgent
        );

        console.info(
            `[Admin Contact Delete] ${admin.adminId} deleted contact ${id}`
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Contact deleted successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('[Admin Contact Delete] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
