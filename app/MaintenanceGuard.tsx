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
                console.log('[MaintenanceGuard] Fetching maintenance status...');
                const response = await fetch('/api/settings/maintenance');
                console.log('[MaintenanceGuard] API Response status:', response.status, response.ok);
                if (!response.ok) return;
                const data = await response.json();
                console.log('[MaintenanceGuard] API Response data:', JSON.stringify(data, null, 2));
                if (!isActive) return;
                if (data?.maintenance) {
                    console.log('[MaintenanceGuard] Setting maintenance state:', data.maintenance);
                    setMaintenance(data.maintenance);
                } else {
                    console.log('[MaintenanceGuard] No maintenance data in response');
                }
            } catch (error) {
                console.warn('[MaintenanceGuard] Failed to fetch maintenance status:', error);
            }
        };

        fetchMaintenance();

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        console.log('[MaintenanceGuard] Path check effect triggered:', {
            pathname,
            isAdmin,
            maintenance: maintenance ? {
                enabled: maintenance.enabled,
                blockedPaths: maintenance.blockedPaths
            } : null
        });
        if (!maintenance || !maintenance.enabled || isAdmin) return;
        if (!maintenance.blockedPaths?.length) return;
        if (pathname === '/') return;

        const isBlocked = maintenance.blockedPaths.some((blockedPath) => {
            if (blockedPath === '/') return pathname === '/';
            return pathname === blockedPath || pathname.startsWith(`${blockedPath}/`);
        });

        console.log('[MaintenanceGuard] Is path blocked?', isBlocked);
        if (isBlocked) {
            console.log('[MaintenanceGuard] Redirecting to home due to blocked path');
            router.replace('/');
        }
    }, [maintenance, pathname, router, isAdmin]);

    console.log('[MaintenanceGuard] Render check:', {
        hasMaintenanceData: !!maintenance,
        enabled: maintenance?.enabled,
        isAdmin,
        pathname,
        willRender: !(!maintenance || !maintenance.enabled || isAdmin)
    });

    if (!maintenance || !maintenance.enabled || isAdmin) {
        return null;
    }

    const message = maintenance.message?.trim() || DEFAULT_MESSAGE;
    console.log('[MaintenanceGuard] Rendering maintenance banner with message:', message);

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
