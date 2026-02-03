/**
 * エラーハンドリング統一ユーティリティ
 * requirements_definition.md §9 に基づく
 */

/**
 * エラーからユーザー向けメッセージを生成
 * @param error - キャッチしたエラー
 * @returns ユーザー向けエラーメッセージ
 */
export function getErrorMessage(error: unknown): string {
    // オフライン状態チェック
    if (typeof window !== 'undefined' && !navigator.onLine) {
        return 'オフラインです。インターネット接続を確認してください。';
    }

    if (error instanceof Error) {
        // ストレージ容量不足
        if (error.name === 'QuotaExceededError') {
            return 'ストレージ容量が不足しています。古いログを削除してください。';
        }

        // Firebase 認証エラー
        if (error.message.includes('auth') || error.message.includes('permission')) {
            return '認証エラーが発生しました。再ログインしてください。';
        }

        // ネットワークエラー
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return 'ネットワークエラーが発生しました。接続を確認してください。';
        }

        // Firestore エラー
        if (error.message.includes('Firestore') || error.message.includes('Firebase')) {
            return 'サーバーに接続できません。しばらくしてから再度お試しください。';
        }

        // その他の Error インスタンス
        return error.message || '予期しないエラーが発生しました。';
    }

    // 不明なエラー
    return '予期しないエラーが発生しました。しばらくしてから再度お試しください。';
}

/**
 * オフライン検知のセットアップ
 * @param onOffline - オフライン時のコールバック
 * @param onOnline - オンライン復帰時のコールバック
 * @returns クリーンアップ関数
 */
export function setupOfflineDetection(
    onOffline: () => void,
    onOnline: () => void
): () => void {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const handleOffline = () => {
        console.log('オフライン検知');
        onOffline();
    };

    const handleOnline = () => {
        console.log('オンライン復帰');
        onOnline();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
    };
}

/**
 * ストレージ容量チェック
 * @returns 容量が十分な場合true
 */
export async function checkStorageQuota(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
        return true; // API 未対応の場合は true を返す
    }

    try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;

        // 使用率が 90% 以上の場合は警告
        if (quota > 0 && usage / quota > 0.9) {
            console.warn(`Storage usage: ${(usage / quota * 100).toFixed(2)}%`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Storage quota check error:', error);
        return true; // エラー時は true を返す
    }
}

/**
 * 画像サイズチェック
 * @param file - チェックする画像ファイル
 * @param maxSizeMB - 最大サイズ（MB）デフォルト5MB
 * @returns エラーメッセージ、または null（サイズが適切な場合）
 */
export function checkImageSize(file: File, maxSizeMB: number = 5): string | null {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `画像サイズが大きすぎます。${maxSizeMB}MB以下にしてください。`;
    }
    return null;
}

/**
 * エラー通知表示（モーダル）
 * @param message - 表示するメッセージ
 */
export function showErrorNotification(message: string): void {
    if (typeof window !== 'undefined') {
        showModal(message, 'error');
    }
}

/**
 * 成功通知表示（モーダル）
 * @param message - 表示するメッセージ
 */
export function showSuccessNotification(message: string): void {
    if (typeof window !== 'undefined') {
        showModal(message, 'success');
    }
}

/**
 * 確認ダイアログ表示（モーダル）
 * @param message - 表示するメッセージ
 * @param onConfirm - OKボタン押下時のコールバック
 */
export function showConfirmModal(message: string, onConfirm: () => void): void {
    if (typeof window !== 'undefined') {
        showConfirmModalInternal(message, onConfirm);
    }
}

/**
 * 確認モーダル表示（画面中央、OK/キャンセル付き）
 */
function showConfirmModalInternal(message: string, onConfirm: () => void): void {
    // 既存のモーダルを削除
    const existingModal = document.getElementById('michikusa_memory-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // モーダル作成
    const overlay = document.createElement('div');
    overlay.id = 'michikusa_memory-modal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 4px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        line-height: 1.6;
        color: #333;
        text-align: center;
        white-space: pre-wrap;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 0.5rem;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'キャンセル';
    cancelButton.style.cssText = `
        flex: 1;
        padding: 0.75rem;
        font-size: 1rem;
        background: #f5f5f5;
        color: #666;
        border: 1px solid #ddd;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
    cancelButton.onmouseover = () => {
        cancelButton.style.background = '#e0e0e0';
        cancelButton.style.borderColor = '#999';
    };
    cancelButton.onmouseout = () => {
        cancelButton.style.background = '#f5f5f5';
        cancelButton.style.borderColor = '#ddd';
    };
    cancelButton.onclick = () => overlay.remove();

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'OK';
    confirmButton.style.cssText = `
        flex: 1;
        padding: 0.75rem;
        font-size: 1rem;
        background: #333;
        color: white;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        transition: background 0.2s ease;
    `;
    confirmButton.onmouseover = () => confirmButton.style.background = '#555';
    confirmButton.onmouseout = () => confirmButton.style.background = '#333';
    confirmButton.onclick = () => {
        overlay.remove();
        onConfirm();
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);

    modal.appendChild(messageEl);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // アニメーション追加
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // Escapeキーで閉じる
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}


/**
 * モーダル表示（画面中央）
 * @param message - 表示するメッセージ
 * @param type - 'error' | 'success' | 'info'
 */
function showModal(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
    // 既存のモーダルを削除
    const existingModal = document.getElementById('michikusa_memory-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // モーダル作成
    const overlay = document.createElement('div');
    overlay.id = 'michikusa_memory-modal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 4px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        line-height: 1.6;
        color: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : '#333'};
        text-align: center;
    `;

    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.cssText = `
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        background: #333;
        color: white;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        transition: background 0.2s ease;
    `;
    button.onmouseover = () => button.style.background = '#555';
    button.onmouseout = () => button.style.background = '#333';
    button.onclick = () => overlay.remove();

    modal.appendChild(messageEl);
    modal.appendChild(button);
    overlay.appendChild(modal);

    // アニメーション追加
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // Escapeキーで閉じる
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}
