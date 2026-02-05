import { getAdminDb } from './admin-firestore';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * お問い合わせドキュメントの型定義
 */
export interface ContactDocument {
    contactId: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'inProgress' | 'resolved' | 'closed';
    createdAt: Timestamp;
    updatedAt: Timestamp | null;
    userAgent: string;
    ip: string;
    adminNote: string | null;
    assignedTo: string | null;
    readAt: Timestamp | null;
}

/**
 * お問い合わせ一覧を取得
 * @param status - ステータスフィルター（オプション）
 * @param limit - 取得件数
 * @param offset - オフセット
 * @returns お問い合わせドキュメントの配列と総件数
 */
export async function getContacts(
    status?: string,
    limit: number = 25,
    offset: number = 0
): Promise<{ contacts: ContactDocument[]; total: number }> {
    const db = getAdminDb();
    let query = db.collection('contacts').orderBy('createdAt', 'desc');

    // ステータスフィルター
    if (status && status !== 'all') {
        query = query.where('status', '==', status) as any;
    }

    // 総件数を取得（フィルター適用後）
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // ページネーション
    const snapshot = await query.limit(limit).offset(offset).get();

    const contacts: ContactDocument[] = snapshot.docs.map((doc) => ({
        ...doc.data(),
        contactId: doc.id,
    })) as ContactDocument[];

    return { contacts, total };
}

/**
 * お問い合わせIDで詳細を取得
 * @param contactId - お問い合わせ ID
 * @returns お問い合わせドキュメント、またはない場合は null
 */
export async function getContactById(contactId: string): Promise<ContactDocument | null> {
    const db = getAdminDb();
    const doc = await db.collection('contacts').doc(contactId).get();

    if (!doc.exists) return null;

    return {
        ...doc.data(),
        contactId: doc.id,
    } as ContactDocument;
}

/**
 * お問い合わせを更新
 * @param contactId - お問い合わせ ID
 * @param data - 更新データ
 */
export async function updateContact(
    contactId: string,
    data: Partial<Omit<ContactDocument, 'contactId' | 'createdAt'>>
): Promise<void> {
    const db = getAdminDb();

    // updatedAt を自動設定
    const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    // createdAt は更新しない
    delete (updateData as any).createdAt;

    await db.collection('contacts').doc(contactId).update(updateData);
}

/**
 * お問い合わせを既読にする
 * @param contactId - お問い合わせ ID
 */
export async function markContactAsRead(contactId: string): Promise<void> {
    const db = getAdminDb();

    await db.collection('contacts').doc(contactId).update({
        status: 'read',
        readAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
}

/**
 * お問い合わせを削除（superadminのみ）
 * @param contactId - お問い合わせ ID
 */
export async function deleteContact(contactId: string): Promise<void> {
    const db = getAdminDb();
    await db.collection('contacts').doc(contactId).delete();
}

/**
 * ステータス別の件数を取得
 * @returns ステータス別の集計
 */
export async function getContactsStats(): Promise<{
    total: number;
    new: number;
    read: number;
    inProgress: number;
    resolved: number;
    closed: number;
}> {
    const db = getAdminDb();

    const [totalSnap, newSnap, readSnap, inProgressSnap, resolvedSnap, closedSnap] =
        await Promise.all([
            db.collection('contacts').count().get(),
            db.collection('contacts').where('status', '==', 'new').count().get(),
            db.collection('contacts').where('status', '==', 'read').count().get(),
            db.collection('contacts').where('status', '==', 'inProgress').count().get(),
            db.collection('contacts').where('status', '==', 'resolved').count().get(),
            db.collection('contacts').where('status', '==', 'closed').count().get(),
        ]);

    return {
        total: totalSnap.data().count,
        new: newSnap.data().count,
        read: readSnap.data().count,
        inProgress: inProgressSnap.data().count,
        resolved: resolvedSnap.data().count,
        closed: closedSnap.data().count,
    };
}
