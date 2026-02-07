/**
 * 画像選択ユーティリティ
 * ギャラリーからの画像選択機能（共有機能が有効な場合のみ）
 */

export function openGalleryPicker(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0] || null;
            resolve(file);
            document.body.removeChild(input);
        };

        input.oncancel = () => {
            resolve(null);
            document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
    });
}

export function isCameraInputSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const input = document.createElement('input');
    return (
        'capture' in input &&
        (input as any).capture !== undefined
    );
}
