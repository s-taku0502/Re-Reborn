'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './settings.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

type TabType = 'maintenance' | 'features' | 'advertising';

interface SystemSettings {
    maintenanceMode: {
        enabled: boolean;
        message: string;
        startDate: string | null;
        endDate: string | null;
        blockedPaths: string[];
    };
    features: {
        walkingLogs: boolean;
        oracle: boolean;
        album: boolean;
        contact: boolean;
        sharing: boolean;
    };
    advertising: {
        enabled: boolean;
        positions: {
            topPage: boolean;
            recordPage: boolean;
            oraclePage: boolean;
            albumPage: boolean;
        };
        refreshInterval: number;
    };
    updatedAt: string;
    updatedBy: string;
}

const MAINTENANCE_PATH_OPTIONS = [
    { label: 'トップ', path: '/' },
    { label: 'ミッション', path: '/oracle' },
    { label: '記録', path: '/record' },
    { label: '冒険の書', path: '/album' },
    { label: 'マイページ', path: '/mypage' },
    { label: 'お問い合わせ', path: '/contact' },
    { label: '初期設定', path: '/setup' },
];

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<TabType>('maintenance');
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // URLパラメータからタブを初期化
    useEffect(() => {
        const tab = searchParams.get('tab') as TabType;
        if (tab && ['maintenance', 'features', 'advertising'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // メンテナンスモードが実際に有効かどうかを判定（時間範囲を考慮）
    const isMaintenanceActive = (maintenance: SystemSettings['maintenanceMode']): boolean => {
        if (!maintenance.enabled) return false;
        if (!maintenance.startDate || !maintenance.endDate) return true;

        const now = new Date();
        const parseJstDate = (value: string): Date => {
            const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
            return new Date(hasTimezone ? value : `${value}+09:00`);
        };

        const start = parseJstDate(maintenance.startDate);
        const end = parseJstDate(maintenance.endDate);
        return now >= start && now <= end;
    };

    // 設定を取得
    useEffect(() => {
        if (authLoading || !admin) return;

        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const token = getTokenFromStorage();
                if (!token) {
                    setError('認証トークンがありません');
                    return;
                }

                const response = await fetch('/api/admin/settings', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('設定の取得に失敗しました');
                }

                const data = await response.json();
                const normalizedSettings: SystemSettings = {
                    ...data.settings,
                    maintenanceMode: {
                        ...data.settings.maintenanceMode,
                        blockedPaths: Array.isArray(data.settings.maintenanceMode?.blockedPaths)
                            ? data.settings.maintenanceMode.blockedPaths
                            : [],
                    },
                };
                setSettings(normalizedSettings);
            } catch (err) {
                console.error('[Settings] Error fetching settings:', err);
                setError('設定の取得中にエラーが発生しました');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [admin, authLoading]);

    // メンテナンス時間範囲がある場合、1分ごとに再レンダリング
    useEffect(() => {
        if (!settings?.maintenanceMode.enabled) return;
        if (!settings.maintenanceMode.startDate || !settings.maintenanceMode.endDate) return;

        const interval = setInterval(() => {
            // 強制的に再レンダリング（stateを更新）
            // 注意: hasUnsavedChangesはリセットしない
            setSettings((prev) => {
                if (!prev) return null;
                return { ...prev };
            });
        }, 60000); // 1分ごと

        return () => clearInterval(interval);
    }, [settings?.maintenanceMode.enabled, settings?.maintenanceMode.startDate, settings?.maintenanceMode.endDate]);

    // タブ切り替え
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        router.push(`/admin/settings?tab=${tab}`, { scroll: false });
    };

    // 設定変更時に未保存フラグを立てる
    const updateSettings = (newSettings: SystemSettings) => {
        console.log('[Settings] updateSettings called, setting hasUnsavedChanges to true');
        setHasUnsavedChanges(true);
        setSettings(newSettings);
    };

    // デバッグ用
    useEffect(() => {
        console.log('[Settings] hasUnsavedChanges:', hasUnsavedChanges);
    }, [hasUnsavedChanges]);

    const handleSave = async () => {
        if (!settings) return;

        try {
            setIsSaving(true);
            setError(null);
            setSuccessMessage(null);

            const token = getTokenFromStorage();
            if (!token) {
                setError('認証トークンがありません');
                return;
            }

            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    maintenanceMode: settings.maintenanceMode,
                    features: settings.features,
                    advertising: settings.advertising,
                }),
            });

            if (!response.ok) {
                throw new Error('設定の保存に失敗しました');
            }

            setSuccessMessage('設定を保存しました');
            setHasUnsavedChanges(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('[Settings] Error saving settings:', err);
            setError('設定の保存中にエラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (error && !settings) {
        return (
            <ProtectedAdminRoute>
                <div className={styles.settingsContainer}>
                    <div className={styles.errorMessage}>{error}</div>
                </div>
            </ProtectedAdminRoute>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <ProtectedAdminRoute>
            <div className={styles.settingsContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>⚙️ システム設定</h1>
                    <p className={styles.subtitle}>
                        アプリケーション全体の設定を管理します
                    </p>
                </div>

                {/* タブナビゲーション */}
                <div className={styles.tabNav}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'maintenance' ? styles.tabButtonActive : ''}`}
                        onClick={() => handleTabChange('maintenance')}
                    >
                        🚧 メンテナンス
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'features' ? styles.tabButtonActive : ''}`}
                        onClick={() => handleTabChange('features')}
                    >
                        🔧 機能トグル
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'advertising' ? styles.tabButtonActive : ''}`}
                        onClick={() => handleTabChange('advertising')}
                    >
                        📢 広告設定
                    </button>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
                
                {/* デバッグ情報（開発時のみ表示） */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{ 
                        padding: '0.5rem 1rem', 
                        background: '#f0f0f0', 
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace'
                    }}>
                        Debug: hasUnsavedChanges = {hasUnsavedChanges ? 'true' : 'false'}
                    </div>
                )}

                {/* メンテナンスモード */}
                {activeTab === 'maintenance' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🚧 メンテナンスモード設定</h2>
                        <p className={styles.sectionDescription}>
                            メンテナンス期間中に特定のページを利用不可にできます
                        </p>
                    </div>

                    <div className={styles.maintenanceToggle}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={settings.maintenanceMode.enabled}
                                onChange={(e) =>
                                    updateSettings({
                                        ...settings,
                                        maintenanceMode: {
                                            ...settings.maintenanceMode,
                                            enabled: e.target.checked,
                                        },
                                    })
                                }
                            />
                            <span className={styles.toggleSlider}></span>
                        </label>
                        <span className={styles.toggleLabel}>
                            {settings.maintenanceMode.enabled ? (
                                isMaintenanceActive(settings.maintenanceMode) ? (
                                    <span style={{ color: '#dc2626' }}>🔴 メンテナンス中</span>
                                ) : (
                                    <span style={{ color: '#ea580c' }}>🟠 メンテナンス予約中（時間外）</span>
                                )
                            ) : (
                                'メンテナンス解除'
                            )}
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>メンテナンスメッセージ</label>
                        <textarea
                            className={styles.textarea}
                            value={settings.maintenanceMode.message}
                            onChange={(e) =>
                                updateSettings({
                                    ...settings,
                                    maintenanceMode: {
                                        ...settings.maintenanceMode,
                                        message: e.target.value,
                                    },
                                })
                            }
                            placeholder="ユーザーに表示するメッセージを入力..."
                            rows={4}
                        />
                    </div>

                    <div className={styles.dateRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>開始日時（任意）</label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={settings.maintenanceMode.startDate || ''}
                                onChange={(e) =>
                                    updateSettings({
                                        ...settings,
                                        maintenanceMode: {
                                            ...settings.maintenanceMode,
                                            startDate: e.target.value || null,
                                        },
                                    })
                                }
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>終了日時（任意）</label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={settings.maintenanceMode.endDate || ''}
                                onChange={(e) =>
                                    updateSettings({
                                        ...settings,
                                        maintenanceMode: {
                                            ...settings.maintenanceMode,
                                            endDate: e.target.value || null,
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>利用不可にするページ</label>
                        <div className={styles.featureGrid}>
                            {MAINTENANCE_PATH_OPTIONS.map((option) => {
                                const isBlocked = settings.maintenanceMode.blockedPaths.includes(option.path);
                                return (
                                    <div key={option.path} className={styles.featureItem}>
                                        <label className={styles.featureToggle}>
                                            <input
                                                type="checkbox"
                                                className={styles.featureToggleInput}
                                                checked={isBlocked}
                                                onChange={(e) => {
                                                    const next = e.target.checked
                                                        ? [...settings.maintenanceMode.blockedPaths, option.path]
                                                        : settings.maintenanceMode.blockedPaths.filter(
                                                            (path) => path !== option.path
                                                        );
                                                    updateSettings({
                                                        ...settings,
                                                        maintenanceMode: {
                                                            ...settings.maintenanceMode,
                                                            blockedPaths: next,
                                                        },
                                                    });
                                                }}
                                            />
                                            <span className={styles.featureToggleSlider}></span>
                                        </label>
                                        <span className={styles.featureLabel}>{option.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>                )}
                {/* 機能トグル */}
                {activeTab === 'features' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🔧 機能トグル設定</h2>
                        <p className={styles.sectionDescription}>
                            各機能の有効/無効を切り替えます
                        </p>
                    </div>

                    <div className={styles.featureGrid}>
                        <div className={styles.featureItem}>
                            <label className={styles.featureToggle}>
                                <input
                                    type="checkbox"
                                    className={styles.featureToggleInput}
                                    checked={settings.features.walkingLogs}
                                    onChange={(e) =>
                                        updateSettings({
                                            ...settings,
                                            features: {
                                                ...settings.features,
                                                walkingLogs: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.featureToggleSlider}></span>
                            </label>
                            <span className={styles.featureLabel}>🚶 散歩記録</span>
                        </div>

                        <div className={styles.featureItem}>
                            <label className={styles.featureToggle}>
                                <input
                                    type="checkbox"
                                    className={styles.featureToggleInput}
                                    checked={settings.features.oracle}
                                    onChange={(e) =>
                                        updateSettings({
                                            ...settings,
                                            features: {
                                                ...settings.features,
                                                oracle: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.featureToggleSlider}></span>
                            </label>
                            <span className={styles.featureLabel}>🔮 お告げ機能</span>
                        </div>

                        <div className={styles.featureItem}>
                            <label className={styles.featureToggle}>
                                <input
                                    type="checkbox"
                                    className={styles.featureToggleInput}
                                    checked={settings.features.album}
                                    onChange={(e) =>
                                        updateSettings({
                                            ...settings,
                                            features: {
                                                ...settings.features,
                                                album: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.featureToggleSlider}></span>
                            </label>
                            <span className={styles.featureLabel}>📷 アルバム</span>
                        </div>

                        <div className={styles.featureItem}>
                            <label className={styles.featureToggle}>
                                <input
                                    type="checkbox"
                                    className={styles.featureToggleInput}
                                    checked={settings.features.contact}
                                    onChange={(e) =>
                                        updateSettings({
                                            ...settings,
                                            features: {
                                                ...settings.features,
                                                contact: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.featureToggleSlider}></span>
                            </label>
                            <span className={styles.featureLabel}>✉️ お問い合わせ</span>
                        </div>

                        <div className={styles.featureItem}>
                            <label className={styles.featureToggle}>
                                <input
                                    type="checkbox"
                                    className={styles.featureToggleInput}
                                    checked={settings.features.sharing}
                                    onChange={(e) =>
                                        updateSettings({
                                            ...settings,
                                            features: {
                                                ...settings.features,
                                                sharing: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.featureToggleSlider}></span>
                            </label>
                            <span className={styles.featureLabel}>🔗 共有機能</span>
                        </div>
                    </div>
                </div>
                )}

                {/* 広告設定 */}
                {activeTab === 'advertising' && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>📢 広告表示設定</h2>
                        <p className={styles.sectionDescription}>
                            広告の表示/非表示とページ単位の設定を管理します
                        </p>
                    </div>

                    <div className={styles.adToggle}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={settings.advertising.enabled}
                                onChange={(e) =>
                                    updateSettings({
                                        ...settings,
                                        advertising: {
                                            ...settings.advertising,
                                            enabled: e.target.checked,
                                        },
                                    })
                                }
                            />
                            <span className={styles.toggleSlider}></span>
                        </label>
                        <span className={styles.toggleLabel}>
                            {settings.advertising.enabled ? '広告を表示する' : '広告を非表示にする'}
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>表示ページ</label>
                        <div className={styles.positionsGrid}>
                            <div className={styles.positionItem}>
                                <label className={styles.featureToggle}>
                                    <input
                                        type="checkbox"
                                        className={styles.featureToggleInput}
                                        checked={settings.advertising.positions.topPage}
                                        onChange={(e) =>
                                            updateSettings({
                                                ...settings,
                                                advertising: {
                                                    ...settings.advertising,
                                                    positions: {
                                                        ...settings.advertising.positions,
                                                        topPage: e.target.checked,
                                                    },
                                                },
                                            })
                                        }
                                        disabled={!settings.advertising.enabled}
                                    />
                                    <span className={styles.featureToggleSlider}></span>
                                </label>
                                <span className={styles.featureLabel}>トップページ</span>
                            </div>

                            <div className={styles.positionItem}>
                                <label className={styles.featureToggle}>
                                    <input
                                        type="checkbox"
                                        className={styles.featureToggleInput}
                                        checked={settings.advertising.positions.recordPage}
                                        onChange={(e) =>
                                            updateSettings({
                                                ...settings,
                                                advertising: {
                                                    ...settings.advertising,
                                                    positions: {
                                                        ...settings.advertising.positions,
                                                        recordPage: e.target.checked,
                                                    },
                                                },
                                            })
                                        }
                                        disabled={!settings.advertising.enabled}
                                    />
                                    <span className={styles.featureToggleSlider}></span>
                                </label>
                                <span className={styles.featureLabel}>散歩記録ページ</span>
                            </div>

                            <div className={styles.positionItem}>
                                <label className={styles.featureToggle}>
                                    <input
                                        type="checkbox"
                                        className={styles.featureToggleInput}
                                        checked={settings.advertising.positions.oraclePage}
                                        onChange={(e) =>
                                            updateSettings({
                                                ...settings,
                                                advertising: {
                                                    ...settings.advertising,
                                                    positions: {
                                                        ...settings.advertising.positions,
                                                        oraclePage: e.target.checked,
                                                    },
                                                },
                                            })
                                        }
                                        disabled={!settings.advertising.enabled}
                                    />
                                    <span className={styles.featureToggleSlider}></span>
                                </label>
                                <span className={styles.featureLabel}>お告げページ</span>
                            </div>

                            <div className={styles.positionItem}>
                                <label className={styles.featureToggle}>
                                    <input
                                        type="checkbox"
                                        className={styles.featureToggleInput}
                                        checked={settings.advertising.positions.albumPage}
                                        onChange={(e) =>
                                            updateSettings({
                                                ...settings,
                                                advertising: {
                                                    ...settings.advertising,
                                                    positions: {
                                                        ...settings.advertising.positions,
                                                        albumPage: e.target.checked,
                                                    },
                                                },
                                            })
                                        }
                                        disabled={!settings.advertising.enabled}
                                    />
                                    <span className={styles.featureToggleSlider}></span>
                                </label>
                                <span className={styles.featureLabel}>アルバムページ</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>広告リフレッシュ間隔</label>
                        <div className={styles.intervalGroup}>
                            <input
                                type="number"
                                className={`${styles.input} ${styles.intervalInput}`}
                                value={settings.advertising.refreshInterval}
                                onChange={(e) =>
                                    updateSettings({
                                        ...settings,
                                        advertising: {
                                            ...settings.advertising,
                                            refreshInterval: parseInt(e.target.value) || 30,
                                        },
                                    })
                                }
                                min="10"
                                max="300"
                                disabled={!settings.advertising.enabled}
                            />
                            <span className={styles.intervalUnit}>秒</span>
                        </div>
                    </div>
                </div>
                )}

                {/* 保存ボタン */}
                <div className={styles.saveButtonContainer}>
                    <button
                        className={`${styles.saveButton} ${hasUnsavedChanges ? styles.saveButtonActive : ''}`}
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                    >
                        {isSaving ? (
                            <>
                                <span className={styles.spinner} />
                                保存中...
                            </>
                        ) : hasUnsavedChanges ? (
                            <>💾 変更を保存</>
                        ) : (
                            <>✓ 保存済み</>
                        )}
                    </button>
                    {hasUnsavedChanges && (
                        <p className={styles.unsavedNote}>未保存の変更があります</p>
                    )}
                </div>
            </div>
        </ProtectedAdminRoute>
    );
}
