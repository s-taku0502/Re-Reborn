import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicIdFromUrl(url: string): string | null {
    try {
        const match = url.match(/\/michikusa_memory\/[^/]+\/([^/.]+)/);
        if (!match) return null;
        const segments = url.split('/upload/')[1];
        if (!segments) return null;
        const parts = segments.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder = parts.slice(1, -1).join('/');
        return folder ? `${folder}/${filename}` : filename;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const userId = String(body?.userId || '').trim();

        if (!userId) {
            return NextResponse.json(
                { ok: false, code: 'INVALID_INPUT', message: 'ユーザーIDが必要です' },
                { status: 400 }
            );
        }

        // Firestore からユーザーのログを取得
        const db = getAdminFirestore();
        const logsRef = db.collection('users').doc(userId).collection('logs');
        const logsSnap = await logsRef.get();

        const imageUrls: string[] = [];
        logsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.imageUrl && typeof data.imageUrl === 'string') {
                imageUrls.push(data.imageUrl);
            }
        });

        if (imageUrls.length === 0) {
            return NextResponse.json({ ok: true, deletedCount: 0, message: '削除する画像がありません' });
        }

        // Cloudinary から削除
        const deletedPublicIds: string[] = [];
        const failedUrls: string[] = [];

        for (const url of imageUrls) {
            const publicId = extractPublicIdFromUrl(url);
            if (!publicId) {
                failedUrls.push(url);
                continue;
            }

            try {
                await cloudinary.uploader.destroy(publicId);
                deletedPublicIds.push(publicId);
            } catch (error) {
                console.error(`Failed to delete ${publicId}:`, error);
                failedUrls.push(url);
            }
        }

        // フォルダ削除を試みる
        try {
            await cloudinary.api.delete_folder(`michikusa_memory/${userId}`);
        } catch (error) {
            console.warn(`Failed to delete folder for ${userId}:`, error);
        }

        return NextResponse.json({
            ok: true,
            deletedCount: deletedPublicIds.length,
            failedCount: failedUrls.length,
            message: `${deletedPublicIds.length}件の画像を削除しました`,
        });
    } catch (error) {
        console.error('Delete images API error:', error);
        return NextResponse.json(
            { ok: false, code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
