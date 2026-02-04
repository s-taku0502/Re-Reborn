/**
 * クライアント側の画像圧縮ユーティリティ
 * メモリ使用量を最小限に抑えながら、高品質な圧縮を実現
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    maxSizeMB?: number;
    quality?: number;
    format?: 'jpeg' | 'webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1024,
    maxHeight: 1024,
    maxSizeMB: 5,
    quality: 0.8,
    format: 'jpeg',
};

/**
 * ファイルサイズを人間が読める形式に変換
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 画像を圧縮
 * @param file - 圧縮対象のファイル
 * @param options - 圧縮オプション
 * @returns 圧縮されたBlob
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                try {
                    // キャンバスにスケールダウンして描画
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // アスペクト比を保ったまま、最大サイズにリサイズ
                    if (opts.maxWidth && opts.maxHeight) {
                        const maxWidth = opts.maxWidth;
                        const maxHeight = opts.maxHeight;

                        if (width > maxWidth || height > maxHeight) {
                            const aspectRatio = width / height;
                            if (width > height) {
                                width = maxWidth;
                                height = Math.round(width / aspectRatio);
                            } else {
                                height = maxHeight;
                                width = Math.round(height * aspectRatio);
                            }
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // 高品質な描画
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('Failed to get canvas context');

                    ctx.drawImage(img, 0, 0, width, height);

                    // MIME type 設定
                    const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';

                    // canvas から blob に変換
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Failed to compress image'));
                                return;
                            }

                            // サイズが大きい場合は品質を下げてリトライ
                            const maxBytes = (opts.maxSizeMB || 5) * 1024 * 1024;
                            if (blob.size > maxBytes) {
                                // 品質を80%まで下げる
                                const lowerQuality = Math.max(opts.quality! - 0.1, 0.5);
                                compressImage(file, { ...opts, quality: lowerQuality })
                                    .then(resolve)
                                    .catch(reject);
                                return;
                            }

                            resolve(blob);

                            // メモリ解放
                            canvas.width = 0;
                            canvas.height = 0;
                        },
                        mimeType,
                        opts.quality
                    );
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        // 小さいメモリ用にデータURLで読み込む
        reader.readAsDataURL(file);
    });
}

/**
 * 画像を圧縮してBase64に変換
 */
export async function compressImageToBase64(
    file: File,
    options: CompressionOptions = {}
): Promise<string> {
    const blob = await compressImage(file, options);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = () => {
            reject(new Error('Failed to convert blob to base64'));
        };
        reader.readAsDataURL(blob);
    });
}

/**
 * 画像を圧縮してFileに変換
 */
export async function compressImageToFile(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const blob = await compressImage(file, options);
    const format = options.format === 'webp' ? 'webp' : 'jpeg';
    return new File([blob], `compressed.${format}`, { type: blob.type });
}
