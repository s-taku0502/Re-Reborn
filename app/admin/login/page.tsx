'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { saveTokenToStorage, decodeToken } from '@/lib/admin-jwt';
import { useAdminAuth } from '@/lib/admin-auth-context';

interface LoginResponse {
    success: boolean;
    error?: string;
    adminId?: string;
    email?: string;
    displayName?: string;
    role?: string;
    token?: string;
    expiresIn?: number;
}

export default function AdminLoginPage() {
    const router = useRouter();
    const { setAdminAuth, isLoading: authLoading } = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState<number | null>(null);

    // ロックアウトのカウントダウン
    useEffect(() => {
        if (!isLocked || lockoutTimeRemaining === null) return;

        if (lockoutTimeRemaining <= 0) {
            setIsLocked(false);
            setLockoutTimeRemaining(null);
            return;
        }

        const timer = setTimeout(() => {
            setLockoutTimeRemaining(lockoutTimeRemaining - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [isLocked, lockoutTimeRemaining]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // バリデーション
            if (!email || !password) {
                setError('メールアドレスとパスワードを入力してください');
                setIsLoading(false);
                return;
            }

            if (!/^\d{7}$/.test(password)) {
                setError('パスワードは7桁の数字である必要があります');
                setIsLoading(false);
                return;
            }

            console.log('[Admin Login] Attempting login for:', email);

            // ログインリクエストを送信
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data: LoginResponse = await response.json();

            if (!response.ok) {
                if (response.status === 423) {
                    // ロックアウト状態
                    setIsLocked(true);

                    // レスポンスからロック時間を抽出
                    const match = data.error?.match(/(\d+) minutes/);
                    if (match) {
                        setLockoutTimeRemaining(parseInt(match[1]) * 60);
                    }

                    setError(
                        data.error ||
                        'ログイン試行回数が多すぎます。15分後に再度お試しください。'
                    );
                } else {
                    console.error('[Admin Login] Login failed:', data.error);
                    setError(data.error || 'ログインに失敗しました');
                }
                setIsLoading(false);
                return;
            }

            // ログイン成功
            if (!data.token) {
                console.error('[Admin Login] No token in response');
                setError('トークンの取得に失敗しました');
                setIsLoading(false);
                return;
            }

            console.log('[Admin Login] Login successful, saving token');
            
            // 1. トークンを localStorage に保存
            saveTokenToStorage(data.token);

            // 2. トークンを検証して payload を取得
            const payload = decodeToken(data.token);
            if (!payload) {
                console.error('[Admin Login] Token verification failed');
                setError('トークンの検証に失敗しました');
                setIsLoading(false);
                return;
            }

            console.log('[Admin Login] Token verified, setting auth state');

            // 3. 認証状態を更新
            setAdminAuth(payload);

            console.log('[Admin Login] Auth state set, redirecting to dashboard');

            // 4. ダッシュボードへリダイレクト（次のレンダリングサイクルで実行）
            setTimeout(() => {
                router.push('/admin');
            }, 0);
        } catch (err) {
            console.error('[Admin Login] Error:', err);
            setError('ネットワークエラーが発生しました。もう一度お試しください。');
            setIsLoading(false);
        }
    };

    const formatLockoutTime = (seconds: number | null): string => {
        if (seconds === null) return '';
        const minutes = Math.ceil(seconds / 60);
        return `${minutes}分`;
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <h1 className={styles.loginTitle}>管理者ログイン</h1>
                    <p className={styles.loginSubtitle}>
                        みちくさメモリー管理画面
                    </p>
                </div>

                {error && (
                    isLocked ? (
                        <div className={styles.lockoutAlert}>
                            <strong>⏱️ アカウントがロックされています</strong>
                            {error}
                            {lockoutTimeRemaining !== null && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    残り時間: <strong>{formatLockoutTime(lockoutTimeRemaining)}</strong>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.errorAlert}>
                            <strong>⚠️ ログインエラー</strong>
                            {error}
                        </div>
                    )
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.formLabel}>
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={styles.formInput}
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading || isLocked}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.formLabel}>
                            パスワード
                        </label>
                        <input
                            id="password"
                            type="password"
                            className={styles.formInput}
                            placeholder="7桁の数字"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading || isLocked}
                            autoComplete="current-password"
                            pattern="\d{7}"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading || isLocked}
                    >
                        {isLoading && <span className={styles.loadingSpinner} />}
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div className={styles.footerText}>
                    <p>初期セットアップについてはドキュメントを参照してください</p>
                </div>
            </div>
        </div>
    );
}
