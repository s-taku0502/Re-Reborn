'use client';

import { Suspense } from 'react';
import SettingsContent from './SettingsContent';
import styles from './settings.module.css';

function SettingsLoading() {
    return (
        <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>設定を読み込み中...</p>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<SettingsLoading />}>
            <SettingsContent />
        </Suspense>
    );
}
