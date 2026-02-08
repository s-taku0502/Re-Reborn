'use client';

import { useEffect, useState, Suspense, ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mission, UserLog } from '@/lib/types';
import { getErrorMessage, showErrorNotification, checkImageSize } from '@/lib/errorHandler';
import { isCloudinaryConfigured, uploadImageFile } from '@/lib/cloudinary';
import { compressImageToFile, formatFileSize } from '@/lib/imageCompression';
import { getImageCaptureMetadata } from '@/lib/imageMetadata';
import { openGalleryPicker } from '@/lib/imageSelection';
import { MAX_LOCATION_LENGTH, MAX_MEMO_LENGTH, sanitizeTextInput, validateLocation, validateMemo } from '@/lib/validation';
import styles from './record.module.css';

function RecordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [userId, setUserId] = useState<string | null>(null);
    const [mission, setMission] = useState<Mission | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(null);
    const [imageCapturedAt, setImageCapturedAt] = useState<Date | null>(null);
    const [imageExifAvailable, setImageExifAvailable] = useState(false);
    const [imageFlagReasons, setImageFlagReasons] = useState<string[]>([]);
    const [memo, setMemo] = useState('');
    const [location, setLocation] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);

    useEffect(() => {
        // ユーザーIDチェック
        const storedUserId = localStorage.getItem('reborn_userId');
        if (!storedUserId) {
            router.push('/setup');
            return;
        }
        setUserId(storedUserId);

        // URLパラメータからミッション情報を取得
        const missionParam = searchParams.get('mission');
        const startTimeParam = searchParams.get('startTime');

        if (missionParam) {
            try {
                const missionData = JSON.parse(decodeURIComponent(missionParam));
                setMission(missionData);
            } catch (error) {
                console.error('Failed to parse mission data:', error);
                router.push('/');
            }
        }

        if (startTimeParam) {
            setStartTime(new Date(startTimeParam));
        }
    }, [router, searchParams]);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadMessage('画像を圧縮中...');

            // EXIF メタデータを取得
            let capturedAt: Date | null = null;
            let exifAvailable = false;
            const flagReasons: string[] = [];

            try {
                const metadata = await getImageCaptureMetadata(file);
                exifAvailable = metadata.exifAvailable;
                capturedAt = metadata.capturedAt;

                // 撮影時刻の検証
                const now = new Date();
                if (!capturedAt) {
                    flagReasons.push('EXIF撮影時刻なし');
                } else if (capturedAt > now) {
                    flagReasons.push('EXIF撮影時刻が未来');
                } else {
                    const diffMinutes = (now.getTime() - capturedAt.getTime()) / (1000 * 60);
                    if (diffMinutes > 10) {
                        flagReasons.push('撮影から10分以上経過');
                    }
                    if (diffMinutes > 24 * 60) {
                        flagReasons.push('撮影から24時間以上経過');
                    }
                }

                console.log('[Record] Image EXIF check:', {
                    capturedAt: capturedAt ? capturedAt.toISOString() : null,
                    exifAvailable,
                    flagReasons,
                });
            } catch (error) {
                console.warn('[Record] EXIF metadata extraction failed:', error);
                flagReasons.push('メタデータエラー');
            }

            // 画像を圧縮（1024x1024、品質80%）
            const compressedFile = await compressImageToFile(file, {
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 0.8,
            });

            // 圧縮後のサイズをログ出力
            console.log(`元のサイズ: ${formatFileSize(file.size)}`);
            console.log(`圧縮後: ${formatFileSize(compressedFile.size)}`);

            // 圧縮後も5MBチェック
            const sizeError = checkImageSize(compressedFile, 5);
            if (sizeError) {
                showErrorNotification(sizeError);
                setUploadMessage(null);
                e.target.value = '';
                return;
            }

            // 古いblob URLを解放
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }

            // メモリ効率的なプレビュー用URL作成
            const objectUrl = URL.createObjectURL(compressedFile);
            setPreviewUrl(objectUrl);
            setImageFile(compressedFile);
            setImageSource('camera');
            setImageCapturedAt(capturedAt);
            setImageExifAvailable(exifAvailable);
            setImageFlagReasons(flagReasons);
            setUploadMessage(`画像を圧縮しました: ${formatFileSize(compressedFile.size)}`);

            // Cloudinaryに即座にアップロード（メモリ節約）
            if (isCloudinaryConfigured() && userId) {
                try {
                    setUploadMessage('画像をアップロード中...');
                    const uploadedUrl = await uploadImageFile(compressedFile, userId);
                    setImageUrl(uploadedUrl);
                    setImageFile(null); // アップロード完了後、ファイルは不要

                    // blob URLを解放してメモリ節約
                    if (objectUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(objectUrl);
                    }
                    setPreviewUrl(uploadedUrl); // Cloudinary URLでプレビュー
                    setUploadMessage('画像アップロード完了');

                    // 成功メッセージを2秒後に消す
                    setTimeout(() => setUploadMessage(null), 2000);
                } catch (uploadError) {
                    console.error('Cloudinary upload failed:', uploadError);
                    showErrorNotification('画像のアップロードに失敗しました');
                    setUploadMessage(null);
                }
            }

            e.target.value = '';
        } catch (error) {
            console.error('Image compression failed:', error);
            showErrorNotification('画像の圧縮に失敗しました');
            setUploadMessage(null);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        if (!userId || !mission) return;

        const sanitizedLocation = sanitizeTextInput(location);
        const sanitizedMemo = sanitizeTextInput(memo);

        const locationValidation = validateLocation(sanitizedLocation);
        if (!locationValidation.valid) {
            showErrorNotification(locationValidation.error!);
            return;
        }

        const memoValidation = validateMemo(sanitizedMemo);
        if (!memoValidation.valid) {
            showErrorNotification(memoValidation.error!);
            return;
        }

        setIsSaving(true);
        setUploadMessage(null);

        try {
            let finalImageUrl: string | undefined = imageUrl || undefined;

            // まだアップロードされていない場合のみアップロード（通常は既にアップロード済み）
            if (!finalImageUrl && imageFile && isCloudinaryConfigured()) {
                setUploadMessage('画像をアップロード中...');
                finalImageUrl = await uploadImageFile(imageFile, userId);
                setUploadMessage('画像アップロード完了');
            }

            // サーバーAPIでログ保存
            const response = await fetch('/api/logs/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    missionId: mission.id,
                    missionText: mission.text,
                    imageUrl: finalImageUrl,
                    imageSource: imageSource || 'camera',
                    imageCapturedAt: imageCapturedAt ? imageCapturedAt.toISOString() : undefined,
                    imageExifAvailable,
                    imageFlagReasons: imageFlagReasons.length > 0 ? imageFlagReasons : undefined,
                    location: sanitizedLocation ? { name: sanitizedLocation } : undefined,
                    memo: sanitizedMemo || undefined,
                    status: 'completed', // 完了ステータス
                    isPublic: false,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.ok) {
                throw new Error(data.message || '保存に失敗しました');
            }

            // キャッシュは最小限に: 画像データはCloudinaryに保存済みのためlocalStorageに保存しない
            // 必要に応じてFirestoreから取得する方針に変更

            setUploadMessage('記録を保存しました');

            // 成功画面へ遷移
            router.push('/record/success');
        } catch (error) {
            console.error('Failed to save log:', error);
            const message = getErrorMessage(error);
            showErrorNotification(`保存に失敗しました: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mission || !userId) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.header}>記録を残す</h1>

                <div className={styles.missionBox}>
                    <p className={styles.missionText}>{mission.text}</p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>写真</label>
                    <div className={styles.imageInputContainer}>
                        {!previewUrl ? (
                            <div className={styles.imageInputOptions}>
                                <label htmlFor="imageInput" className={styles.imageInputLabel}>
                                    <input
                                        key={previewUrl ? 'hidden' : 'visible'}
                                        type="file"
                                        id="imageInput"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleImageCapture}
                                        className={styles.imageInput}
                                    />
                                    <div className={styles.imageInputPlaceholder}>
                                        📷 写真を撮る
                                    </div>
                                </label>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const galleryFile = await openGalleryPicker();
                                            if (galleryFile) {
                                                // ギャラリー選択の場合のイベント作成（手動処理）
                                                const syntheticEvent = {
                                                    target: {
                                                        files: [galleryFile],
                                                    },
                                                } as unknown as ChangeEvent<HTMLInputElement>;
                                                await handleImageCapture(syntheticEvent);
                                            }
                                        } catch (error) {
                                            console.error('Gallery picker error:', error);
                                            showErrorNotification('ギャラリーから選択できませんでした');
                                        }
                                    }}
                                    className={styles.galleryButton}
                                >
                                    🖼️ ギャラリーから選択
                                </button>
                            </div>
                        ) : (
                            <div className={styles.imagePreview}>
                                <img src={previewUrl} alt="撮影した写真" className={styles.previewImage} />
                                <button
                                    onClick={() => {
                                        setImageFile(null);
                                        setImageUrl(null);
                                        setImageSource(null);
                                        setImageCapturedAt(null);
                                        setImageExifAvailable(false);
                                        setImageFlagReasons([]);
                                        if (previewUrl && previewUrl.startsWith('blob:')) {
                                            URL.revokeObjectURL(previewUrl);
                                        }
                                        setPreviewUrl(null);
                                    }}
                                    className={styles.imageChangeButton}
                                >
                                    撮り直す
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="location" className={styles.label}>
                        場所（任意）
                    </label>
                    <input
                        type="text"
                        id="location"
                        value={location}
                        onChange={(e) => {
                            const value = sanitizeTextInput(e.target.value);
                            if (value.length <= MAX_LOCATION_LENGTH) {
                                setLocation(value);
                            }
                        }}
                        className={styles.input}
                        placeholder="例: 公園の近く"
                        maxLength={MAX_LOCATION_LENGTH}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="memo" className={styles.label}>
                        メモ（任意）
                    </label>
                    <textarea
                        id="memo"
                        value={memo}
                        onChange={(e) => {
                            const value = sanitizeTextInput(e.target.value);
                            if (value.length <= MAX_MEMO_LENGTH) {
                                setMemo(value);
                            }
                        }}
                        className={styles.textarea}
                        placeholder="気づいたこと、感じたことを..."
                        rows={4}
                        maxLength={MAX_MEMO_LENGTH}
                    />
                </div>

                {uploadMessage && (
                    <div className={styles.noticeMessage}>{uploadMessage}</div>
                )}

                <button
                    onClick={handleSave}
                    className={styles.primaryButton}
                    disabled={isSaving}
                >
                    {isSaving ? '保存中...' : '保存する'}
                </button>

                <button
                    onClick={async () => {
                        if (!userId || !mission) {
                            router.push('/');
                            return;
                        }

                        // キャンセルしたミッションを履歴として保存
                        try {
                            await fetch('/api/logs/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId,
                                    missionId: mission.id,
                                    missionText: mission.text,
                                    status: 'cancelled',
                                    isPublic: false,
                                }),
                            });

                            // localStorage にもキャッシュ
                            try {
                                const log: UserLog = {
                                    id: `cancelled_${Date.now()}`,
                                    userId,
                                    missionText: mission.text,
                                    missionId: mission.id,
                                    status: 'cancelled',
                                    isPublic: false,
                                    createdAt: new Date().toISOString(),
                                };
                                const logsString = localStorage.getItem('michikusa_memory_logs') || '[]';
                                const logs = JSON.parse(logsString);
                                logs.push(log);
                                localStorage.setItem('michikusa_memory_logs', JSON.stringify(logs));
                            } catch (storageError) {
                                console.warn('localStorage へのキャッシュに失敗しました:', storageError);
                            }
                        } catch (error) {
                            console.error('Failed to save cancelled mission:', error);
                        }

                        router.push('/');
                    }}
                    className={styles.secondaryButton}
                    disabled={isSaving}
                >
                    ⟹ キャンセル
                </button>

                <div className={styles.footer}>
                    <button onClick={() => router.push('/contact')} className={styles.contactButton}>
                        📧 お問い合わせ
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function RecordPage() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <RecordContent />
        </Suspense>
    );
}
