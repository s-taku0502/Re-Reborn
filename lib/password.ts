import bcrypt from 'bcryptjs';

/**
 * パスワードをハッシュ化
 * @param password - 7文字の数字
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

/**
 * パスワードを検証
 * @param password - ユーザーが入力したパスワード（平文）
 * @param hash - 保存されているハッシュ
 * @returns 一致するかどうか
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * 7文字のランダムパスワードを生成
 * @returns 7文字の数字のみのパスワード
 */
export function generateRandomPassword(): string {
    let password = '';
    for (let i = 0; i < 7; i++) {
        password += Math.floor(Math.random() * 10).toString();
    }
    return password;
}

/**
 * パスワードをローカルストレージに保存（ハッシュ化）
 * @param password - 7文字の数字
 */
export async function savePasswordHash(password: string): Promise<void> {
    const hash = await hashPassword(password);
    localStorage.setItem('michikusa_memory_password_hash', hash);
    // 平文パスワードは保存しない
    localStorage.removeItem('michikusa_memory_password');
}

/**
 * ローカルストレージからハッシュを取得
 * @returns ハッシュ、またはnull
 */
export function getPasswordHashFromStorage(): string | null {
    return localStorage.getItem('michikusa_memory_password_hash');
}

/**
 * パスワード再設定（新規発行）
 * @returns 新しい7文字パスワード、またはnull（失敗時）
 */
export async function resetPassword(): Promise<string | null> {
    // ログイン状態を確認
    const userId = localStorage.getItem('reborn_userId');
    if (!userId) {
        return null;
    }

    // 新しいパスワードを生成
    const newPassword = generateRandomPassword();

    // ハッシュ化して保存
    await savePasswordHash(newPassword);

    // 旧パスワードは自動的に削除される
    return newPassword;
}
