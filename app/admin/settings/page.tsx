'use client';

import { useState, useEffect } from 'react';
import styles from './settings.module.css';
import { useAdminAuth, ProtectedAdminRoute } from '@/lib/admin-auth-context';
import { getTokenFromStorage } from '@/lib/admin-jwt';

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
    const { admin, isLoading: authLoading } = useAdminAuth();
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
                        アプリケーション全体の設定を管理します（スーパー管理者のみ）
                    </p>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

                {/* メンテナンスモード */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🚧 メンテナンスモード</h2>
                    </div>

                    <div className={styles.maintenanceToggle}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={settings.maintenanceMode.enabled}
                                onChange={(e) =>
                                    setSettings({
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
                            {settings.maintenanceMode.enabled ? 'メンテナンス中' : 'メンテナンス解除'}
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>メンテナンスメッセージ</label>
                        <textarea
                            className={styles.textarea}
                            value={settings.maintenanceMode.message}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    maintenanceMode: {
                                        ...settings.maintenanceMode,
                                        message: e.target.value,
                                    },
                                })
                            }
                            placeholder="ユーザーに表示するメッセージを入力..."
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
                                    setSettings({
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
                                    setSettings({
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
                                                    setSettings({
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
                </div>

                {/* 機能トグル */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🔧 機能トグル</h2>
                    </div>

                    <div className={styles.featureGrid}>
                        <div className={styles.featureItem}>
                            <label className={styles.featureToggle}>
                                <input
                                    type="checkbox"
                                    className={styles.featureToggleInput}
                                    checked={settings.features.walkingLogs}
                                    onChange={(e) =>
                                        setSettings({
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
                                        setSettings({
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
                                        setSettings({
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
                                        setSettings({
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
                                        setSettings({
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

                {/* 広告設定 */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>📢 広告表示設定</h2>
                    </div>

                    <div className={styles.adToggle}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={settings.advertising.enabled}
                                onChange={(e) =>
                                    setSettings({
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
                                            setSettings({
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
                                            setSettings({
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
                                            setSettings({
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
                                            setSettings({
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
                                    setSettings({
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

                {/* 保存ボタン */}
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? '保存中...' : '💾 設定を保存'}
                </button>
            </div>
        </ProtectedAdminRoute>
    );
}
