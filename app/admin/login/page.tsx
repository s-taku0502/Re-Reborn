'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { saveTokenToStorage } from '@/lib/admin-jwt';

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
                return;
            }

            if (!/^\d{7}$/.test(password)) {
                setError('パスワードは7桁の数字である必要があります');
                return;
            }

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
                    setError(data.error || 'ログインに失敗しました');
                }
                return;
            }

            // ログイン成功
            if (data.token) {
                saveTokenToStorage(data.token);
            }

            // ダッシュボードへリダイレクト
            router.push('/admin');
        } catch (err) {
            console.error('[Admin Login] Error:', err);
            setError('ネットワークエラーが発生しました。もう一度お試しください。');
        } finally {
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
