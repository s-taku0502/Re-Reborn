import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/lib/admin-auth-context';

export const metadata: Metadata = {
    title: '管理者ダッシュボード - みちくさメモリー',
    description: '管理者向け管理画面',
    robots: 'noindex, nofollow', // 管理画面はインデックスしない
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminAuthProvider>
            {children}
        </AdminAuthProvider>
    );
}
