import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/admin-firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getAdminDb();
        const now = new Date();

        // アクティブなお知らせのみ取得
        const snapshot = await db
            .collection('notifications')
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const notifications = snapshot.docs
            .map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.type || 'announcement',
                    title: data.title || '',
                    message: data.message || '',
                    priority: data.priority || 'normal',
                    startAt: data.startAt?.toDate().toISOString() || null,
                    endAt: data.endAt?.toDate().toISOString() || null,
                    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
                };
            })
            .filter((notification) => {
                // 開始・終了日時でフィルタリング
                if (notification.startAt && new Date(notification.startAt) > now) {
                    return false;
                }
                if (notification.endAt && new Date(notification.endAt) < now) {
                    return false;
                }
                return true;
            });

        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        console.error('[Notifications API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'お知らせの取得に失敗しました' },
            { status: 500 }
        );
    }
}
