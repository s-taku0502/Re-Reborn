'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    getTokenFromStorage,
    removeTokenFromStorage,
    isTokenExpired,
    verifyToken,
    AdminJWTPayload,
} from '@/lib/admin-jwt';

interface AdminAuthContextType {
    admin: AdminJWTPayload | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => void;
    refreshAuth: () => Promise<void>;
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

    // 初期化：トークンを検証
    useEffect(() => {
        const initializeAuth = async () => {
            const token = getTokenFromStorage();

            if (!token) {
                setIsLoading(false);
                return;
            }

            // トークンが期限切れか確認
            if (isTokenExpired(token)) {
                removeTokenFromStorage();
                setIsLoading(false);
                return;
            }

            // トークンをデコード
            const payload = verifyToken(token);
            if (payload) {
                setAdmin(payload);
            } else {
                removeTokenFromStorage();
            }

            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    // 認証状態に基づいてリダイレクト
    useEffect(() => {
        if (isLoading) return;

        const isLoginPage = pathname === '/admin/login';
        const isAdminPage = pathname?.startsWith('/admin');

        if (isAdminPage && !isLoginPage && !admin) {
            // 保護されたページ → ログインページへリダイレクト
            router.push('/admin/login');
        } else if (isLoginPage && admin) {
            // ログインページ → ダッシュボードへリダイレクト
            router.push('/admin');
        }
    }, [admin, isLoading, pathname, router]);

    const logout = () => {
        removeTokenFromStorage();
        setAdmin(null);
        router.push('/admin/login');
    };

    const refreshAuth = async () => {
        const token = getTokenFromStorage();
        if (!token) {
            setAdmin(null);
            return;
        }

        try {
            const response = await fetch('/api/admin/auth/verify', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                removeTokenFromStorage();
                setAdmin(null);
                return;
            }

            const payload = verifyToken(token);
            if (payload) {
                setAdmin(payload);
            }
        } catch (error) {
            console.error('[AdminAuthProvider] Error refreshing auth:', error);
            removeTokenFromStorage();
            setAdmin(null);
        }
    };

    return (
        <AdminAuthContext.Provider
            value={{
                admin,
                isLoading,
                isAuthenticated: !!admin,
                logout,
                refreshAuth,
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
