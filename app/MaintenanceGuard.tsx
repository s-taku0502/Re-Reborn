'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type MaintenanceState = {
    enabled: boolean;
    message: string;
    startDate: string | null;
    endDate: string | null;
    blockedPaths: string[];
};

const DEFAULT_MESSAGE = 'メンテナンス中です。しばらくお待ちください。';
const ADMIN_PREFIX = '/admin';

function isAdminPath(pathname: string): boolean {
    return pathname.startsWith(ADMIN_PREFIX);
}

export default function MaintenanceGuard() {
    const router = useRouter();
    const pathname = usePathname() || '/';
    const [maintenance, setMaintenance] = useState<MaintenanceState | null>(null);

    const isAdmin = useMemo(() => isAdminPath(pathname), [pathname]);

    useEffect(() => {
        let isActive = true;

        const fetchMaintenance = async () => {
            try {
                const response = await fetch('/api/settings/maintenance');
                if (!response.ok) return;
                const data = await response.json();
                if (!isActive) return;
                if (data?.maintenance) {
                    setMaintenance(data.maintenance);
                }
            } catch (error) {
                // Silently fail - maintenance data fetch is non-critical
            }
        };

        fetchMaintenance();

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!maintenance || !maintenance.enabled || isAdmin) return;
        if (!maintenance.blockedPaths?.length) return;
        if (pathname === '/') return;

        const isBlocked = maintenance.blockedPaths.some((blockedPath) => {
            if (blockedPath === '/') return pathname === '/';
            return pathname === blockedPath || pathname.startsWith(`${blockedPath}/`);
        });

        if (isBlocked) {
            router.replace('/');
        }
    }, [maintenance, pathname, router, isAdmin]);

    if (!maintenance || !maintenance.enabled || isAdmin) {
        return null;
    }

    const message = maintenance.message?.trim() || DEFAULT_MESSAGE;

    return (
        <div
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: '#fff7ed',
                color: '#9a3412',
                borderBottom: '1px solid #fdba74',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                textAlign: 'center',
            }}
        >
            {message}
        </div>
    );
}
