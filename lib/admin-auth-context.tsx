'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useRef,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    getTokenFromStorage,
    removeTokenFromStorage,
    isTokenExpired,
    decodeToken,
    AdminJWTPayload,
} from '@/lib/admin-jwt';

interface AdminAuthContextType {
    admin: AdminJWTPayload | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
    refreshAuth: () => Promise<void>;
    setAdminAuth: (payload: AdminJWTPayload) => void;
    getToken: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
    undefined
);

/**
 * 管理者認証プロバイダー
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [admin, setAdmin] = useState<AdminJWTPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasInitialized = useRef(false);

    // 初期化：トークンを検証（マウント時に1回だけ）
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const initializeAuth = async () => {
            try {
                const token = getTokenFromStorage();

                if (!token) {
                    console.log('[AdminAuthProvider] No token found in storage');
                    setIsLoading(false);
                    return;
                }

                console.log('[AdminAuthProvider] Token found, validating...');

                // トークンが期限切れか確認
                if (isTokenExpired(token)) {
                    console.warn('[AdminAuthProvider] Token expired');
                    removeTokenFromStorage();
                    setIsLoading(false);
                    return;
                }

                // トークンをデコード
                const payload = decodeToken(token);
                if (payload) {
                    console.log('[AdminAuthProvider] Token valid, setting admin:', payload.email);
                    setAdmin(payload);
                } else {
                    console.error('[AdminAuthProvider] Token verification failed');
                    removeTokenFromStorage();
                }
            } catch (error) {
                console.error('[AdminAuthProvider] Initialize auth error:', error);
                removeTokenFromStorage();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // 認証状態に基づいてリダイレクト（pathname 変更時ごとに確認）
    useEffect(() => {
        if (isLoading) {
            console.log('[AdminAuthProvider] Still loading, skipping redirect check');
            return;
        }

        const isLoginPage = pathname === '/admin/login';
        const isAdminPage = pathname?.startsWith('/admin');

        console.log('[AdminAuthProvider] Redirect check:', {
            pathname,
            isLoginPage,
            isAdminPage,
            hasAdmin: !!admin,
        });

        if (isAdminPage && !isLoginPage && !admin) {
            // 保護されたページ → ログインページへリダイレクト
            console.log('[AdminAuthProvider] Protected page without auth, redirecting to login');
            router.push('/admin/login');
        } else if (isLoginPage && admin) {
            // ログインページ → ダッシュボードへリダイレクト
            console.log('[AdminAuthProvider] Already authenticated, redirecting to dashboard');
            router.push('/admin');
        }
    }, [admin, isLoading, pathname, router]);

    const setAdminAuth = (payload: AdminJWTPayload) => {
        console.log('[AdminAuthProvider] Setting admin auth:', payload.email);
        setAdmin(payload);
    };

    const logout = () => {
        console.log('[AdminAuthProvider] Logging out');
        removeTokenFromStorage();
        setAdmin(null);
        router.push('/admin/login');
    };

    const refreshAuth = async () => {
        const token = getTokenFromStorage();
        if (!token) {
            console.log('[AdminAuthProvider] No token found in refreshAuth');
            setAdmin(null);
            return;
        }

        try {
            console.log('[AdminAuthProvider] Refreshing auth');
            const response = await fetch('/api/admin/auth/verify', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.warn('[AdminAuthProvider] Token verification failed in refreshAuth');
                removeTokenFromStorage();
                setAdmin(null);
                return;
            }

            const payload = decodeToken(token);
            if (payload) {
                console.log('[AdminAuthProvider] Token refreshed successfully');
                setAdmin(payload);
            } else {
                console.error('[AdminAuthProvider] Token verification failed');
                removeTokenFromStorage();
                setAdmin(null);
            }
        } catch (error) {
            console.error('[AdminAuthProvider] Error refreshing auth:', error);
            removeTokenFromStorage();
            setAdmin(null);
        }
    };

    const getToken = () => {
        return getTokenFromStorage();
    };

    return (
        <AdminAuthContext.Provider
            value={{
                admin,
                isLoading,
                isAuthenticated: !!admin,
                logout,
                refreshAuth,
                setAdminAuth,
                getToken,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
}

/**
 * 管理者認証コンテキストを使用するフック
 */
export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
}

/**
 * 認証保護コンポーネント
 */
export function ProtectedAdminRoute({
    children,
    requiredRole,
}: {
    children: ReactNode;
    requiredRole?: 'superadmin' | 'admin' | 'moderator';
}) {
    const { admin, isLoading } = useAdminAuth();

    if (isLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <div>読み込み中...</div>
            </div>
        );
    }

    if (!admin) {
        return null; // ログインページへのリダイレクトは context が処理
    }

    if (requiredRole && admin.role !== requiredRole) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
                <h1>403 - アクセス拒否</h1>
                <p>このページにアクセスする権限がありません</p>
            </div>
        );
    }

    return children;
}
