// Cloudinary Server-side Configuration
// サーバーサイドAPI実装時に使用（Phase 3+）

import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary SDK 設定（サーバーサイド専用）
 * api_secret を使用するためクライアントでは呼び出さないこと
 */
export function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET, // サーバーサイドのみ
    });

    return cloudinary;
}

/**
 * 画像をCloudinaryにアップロード（サーバーサイド）
 * @param imageData - Base64画像データまたはファイルパス
 * @param userId - ユーザーID（フォルダ分け用）
 * @returns アップロード結果
 */
export async function uploadImageServer(imageData: string, userId: string) {
    const cloudinary = configureCloudinary();

    const uploadResult = await cloudinary.uploader.upload(imageData, {
        folder: `michikusa_memory/${userId}`,
        resource_type: 'image',
        transformation: [
            {
                width: 1920,
                height: 1080,
                crop: 'limit',
                quality: 'auto',
                fetch_format: 'auto',
            },
        ],
    });

    return uploadResult;
}

/**
 * Cloudinaryから画像を削除（サーバーサイド）
 * @param publicId - Cloudinary public_id
 * @returns 削除結果
 */
export async function deleteImageServer(publicId: string) {
    const cloudinary = configureCloudinary();

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
    });

    return result;
}

/**
 * 複数画像を一括削除（サーバーサイド）
 * @param publicIds - Cloudinary public_id の配列
 * @returns 削除結果
 */
export async function deleteImagesServer(publicIds: string[]) {
    const cloudinary = configureCloudinary();

    const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image',
    });

    return result;
}

/**
 * ユーザーフォルダ内の全画像を削除（サーバーサイド）
 * @param userId - ユーザーID
 * @returns 削除結果
 */
export async function deleteUserImagesServer(userId: string) {
    const cloudinary = configureCloudinary();

    // フォルダ内の全リソースを削除
    const result = await cloudinary.api.delete_resources_by_prefix(
        `michikusa_memory/${userId}`,
        {
            resource_type: 'image',
        }
    );

    return result;
}

/**
 * 最適化されたURL生成（サーバーサイド）
 * @param publicId - Cloudinary public_id
 * @param options - 変換オプション
 * @returns 最適化されたURL
 */
export function generateOptimizedUrlServer(
    publicId: string,
    options?: {
        width?: number;
        height?: number;
        crop?: string;
        gravity?: string;
        quality?: string;
        format?: string;
    }
) {
    const cloudinary = configureCloudinary();

    return cloudinary.url(publicId, {
        fetch_format: options?.format || 'auto',
        quality: options?.quality || 'auto',
        width: options?.width,
        height: options?.height,
        crop: options?.crop || 'limit',
        gravity: options?.gravity,
    });
}

/**
 * サムネイルURL生成（サーバーサイド）
 */
export function getThumbnailUrlServer(publicId: string) {
    return generateOptimizedUrlServer(publicId, {
        width: 150,
        height: 150,
        crop: 'thumb',
        gravity: 'auto',
    });
}

/**
 * 中サイズURL生成（サーバーサイド）
 */
export function getMediumUrlServer(publicId: string) {
    return generateOptimizedUrlServer(publicId, {
        width: 800,
        height: 600,
        crop: 'fit',
    });
}

/**
 * 大サイズURL生成（サーバーサイド）
 */
export function getLargeUrlServer(publicId: string) {
    return generateOptimizedUrlServer(publicId, {
        width: 1920,
        height: 1080,
        crop: 'fit',
        quality: '80',
    });
}
