// Cloudinary 設定とユーティリティ関数
// Phase 3: 画像アップロード・最適化・変換

/**
 * 注意: Cloudinary SDK (v2) はNode.js環境専用です
 * クライアントサイドでは Fetch API + Unsigned Upload Preset を使用します
 * サーバーサイドAPIを実装する場合は下記のSDK設定を使用してください
 * 
 * import { v2 as cloudinary } from 'cloudinary';
 * 
 * cloudinary.config({ 
 *   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 *   api_key: process.env.CLOUDINARY_API_KEY,
 *   api_secret: process.env.CLOUDINARY_API_SECRET // サーバーサイドのみ
 * });
 */

/**
 * Cloudinary 設定オブジェクト（クライアントサイド）
 */
const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
};

/**
 * Cloudinary が設定されているかチェック
 */
export function isCloudinaryConfigured(): boolean {
    return !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
}

/**
 * Cloudinary画像URLの許可判定
 * - res.cloudinary.com のみ許可
 * - cloudName が一致する場合のみ許可
 * - userId が指定されている場合は michikusa_memory/{userId} 配下のみ許可
 */
export function isAllowedImageUrl(url: string, userId?: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'res.cloudinary.com') return false;

        const cloudName = cloudinaryConfig.cloudName;
        if (!cloudName || !parsed.pathname.startsWith(`/${cloudName}/`)) return false;

        if (userId) {
            return parsed.pathname.includes(`/michikusa_memory/${userId}/`);
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * 画像を Cloudinary にアップロード
 * @param imageData - Base64画像データまたはFileオブジェクト
 * @param userId - ユーザーID（フォルダ分け用）
 * @returns Cloudinary URL
 */
export async function uploadToCloudinary(
    imageData: string | File,
    userId: string
): Promise<string> {
    if (!isCloudinaryConfigured()) {
        throw new Error('Cloudinary is not configured. Check environment variables.');
    }

    const formData = new FormData();

    // Base64 または File を判定
    if (typeof imageData === 'string') {
        formData.append('file', imageData);
    } else {
        formData.append('file', imageData);
    }

    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', `michikusa_memory/${userId}`);
    formData.append('timestamp', Date.now().toString());

    console.log('Cloudinary upload folder:', `michikusa_memory/${userId}`);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cloudinary upload failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url;
}

/**
 * Cloudinary URL を変換（リサイズ・最適化）
 * @param url - 元のCloudinary URL
 * @param transformation - 変換設定
 * @returns 変換後のURL
 */
export function transformCloudinaryUrl(
    url: string,
    transformation: {
        width?: number;
        height?: number;
        crop?: 'fill' | 'fit' | 'scale' | 'thumb';
        quality?: 'auto' | number;
        format?: 'auto' | 'jpg' | 'png' | 'webp';
    }
): string {
    if (!url.includes('cloudinary.com')) {
        return url; // Cloudinary URL でない場合はそのまま返す
    }

    const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = transformation;

    // URL を分解
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    // 変換パラメータを構築
    const transforms: string[] = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    transforms.push(`c_${crop}`);
    transforms.push(`q_${quality}`);
    transforms.push(`f_${format}`);

    const transformString = transforms.join(',');

    // 変換後のURLを返す
    return `${parts[0]}/upload/${transformString}/${parts[1]}`;
}

/**
 * サムネイルURL取得（150x150）
 */
export function getThumbnailUrl(url: string): string {
    return transformCloudinaryUrl(url, {
        width: 150,
        height: 150,
        crop: 'thumb',
        quality: 'auto',
        format: 'auto',
    });
}

/**
 * 中サイズURL取得（800x600）
 */
export function getMediumUrl(url: string): string {
    return transformCloudinaryUrl(url, {
        width: 800,
        height: 600,
        crop: 'fit',
        quality: 'auto',
        format: 'auto',
    });
}

/**
 * 大サイズURL取得（1920x1080）
 */
export function getLargeUrl(url: string): string {
    return transformCloudinaryUrl(url, {
        width: 1920,
        height: 1080,
        crop: 'fit',
        quality: 80,
        format: 'auto',
    });
}

/**
 * Cloudinary から画像を削除
 * @param publicId - Cloudinary public_id
 * @requires Backend API（セキュリティ上、クライアントから直接削除は非推奨）
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    // TODO: Phase 3 で Backend API 経由の削除実装
    // セキュリティ上、api_secret が必要なためクライアントから直接削除不可
    console.warn('Cloudinary deletion requires backend API implementation');
    throw new Error('Not implemented: Cloudinary deletion via backend API');
}

/**
 * Cloudinary URL から public_id を抽出
 */
export function extractPublicId(url: string): string | null {
    if (!url.includes('cloudinary.com')) return null;

    const match = url.match(/\/michikusa_memory\/[^/]+\/([^/.]+)/);
    return match ? `michikusa_memory/${match[1]}` : null;
}

/**
 * 画像アップロード用のヘルパー関数（Fileオブジェクト対応）
 * @param file - Fileオブジェクト
 * @param userId - ユーザーID
 * @returns Cloudinary URL
 */
export async function uploadImageFile(file: File, userId: string): Promise<string> {
    // ファイルサイズチェック（5MB制限）
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
        throw new Error(`画像サイズが大きすぎます。${maxSizeMB}MB以下にしてください。`);
    }

    // 画像タイプチェック
    if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイルを選択してください。');
    }

    return uploadToCloudinary(file, userId);
}

/**
 * Base64画像データからアップロード
 * @param base64Data - Base64エンコードされた画像データ
 * @param userId - ユーザーID
 * @returns Cloudinary URL
 */
export async function uploadBase64Image(base64Data: string, userId: string): Promise<string> {
    return uploadToCloudinary(base64Data, userId);
}
