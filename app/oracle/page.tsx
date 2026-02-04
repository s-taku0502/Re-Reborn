'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import missionsData from '@/data/missions.json';
import { Mission } from '@/lib/types';
import { WalkingPersonLoader } from '@/app/components/WalkingPersonLoader';
import styles from './oracle.module.css';
import { getLocationInfo } from '@/lib/geolocation';

export default function OraclePage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [currentMission, setCurrentMission] = useState<Mission | null>(null);
    const [isStarted, setIsStarted] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const initMission = async () => {
            // ユーザーIDチェック
            const storedUserId = localStorage.getItem('reborn_userId');
            if (!storedUserId) {
                router.push('/setup');
                return;
            }

            if (isMounted) {
                setUserId(storedUserId);
                // ランダムにミッションを選択
                await generateNewMission();
            }
        };

        initMission();

        return () => {
            isMounted = false;
        };
    }, [router]);

    const generateNewMission = async () => {
        setIsLoading(true);

        // 位置情報とタイムゾーンを取得（オプション）
        let locationInfo = null;
        let brightnessLevel = 'day';
        let localHour = new Date().getHours();

        try {
            locationInfo = await getLocationInfo();
            if (locationInfo) {
                console.log('[Oracle] Location info:', locationInfo);
                brightnessLevel = locationInfo.brightness;
                if (locationInfo.localDateTime) {
                    localHour = locationInfo.localDateTime.getHours();
                }
            }
        } catch (error) {
            console.warn('[Oracle] Failed to get location info:', error);
        }

        // AI生成を試みる
        try {
            const timeOfDay = localHour < 12 ? 'morning' : localHour < 18 ? 'afternoon' : 'evening';
            const response = await fetch('/api/ai/mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: {
                        timeOfDay,
                        brightness: brightnessLevel,
                        weather: 'clear',
                        location: locationInfo ? {
                            countryCode: locationInfo.countryCode,
                            countryName: locationInfo.countryName,
                            region: locationInfo.region,
                            timezone: locationInfo.timezone,
                            localDateTime: locationInfo.localDateTime?.toISOString(),
                        } : undefined,
                    },
                }),
            });

            if (response.ok) {
                const aiMission = await response.json();
                setCurrentMission(aiMission);
                setIsStarted(false);
                setStartTime(null);
                setElapsedMinutes(0);
                setIsLoading(false);
                return;
            }
        } catch (error) {
            console.warn('AI生成に失敗、フォールバックを使用:', error);
        }

        // フォールバック: JSONから選択
        const missions = missionsData.missions as Mission[];
        const randomIndex = Math.floor(Math.random() * missions.length);
        setCurrentMission(missions[randomIndex]);
        setIsStarted(false);
        setStartTime(null);
        setElapsedMinutes(0);
        setIsLoading(false);
    };

    useEffect(() => {
        // 経過時間の計測
        if (isStarted && startTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const diff = now.getTime() - startTime.getTime();
                const minutes = Math.floor(diff / 60000);
                setElapsedMinutes(minutes);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isStarted, startTime]);

    const handleStart = () => {
        setIsStarted(true);
        setStartTime(new Date());
    };

    const handleRecord = () => {
        if (currentMission) {
            // ミッション情報を渡して記録ページへ
            const missionData = encodeURIComponent(JSON.stringify(currentMission));
            router.push(`/record?mission=${missionData}&startTime=${startTime?.toISOString()}`);
        }
    };

    if (!currentMission || !userId || isLoading) {
        return (
            <div className={styles.container}>
                <main className={styles.main}>
                    <h1 className={styles.header}>今日のミッション</h1>
                    <div className={styles.loadingContainer}>
                        <WalkingPersonLoader />
                        <p className={styles.loadingText}>お題を生成中...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className={styles.container}>
                <main className={styles.main}>
                    <h1 className={styles.header}>今日のミッション</h1>

                    <div className={styles.oracleBox}>
                        <p className={styles.oracleText}>{currentMission.text}</p>
                    </div>

                    <button onClick={handleStart} className={styles.primaryButton}>
                        行動を始める
                    </button>

                    <button
                        onClick={generateNewMission}
                        className={styles.secondaryButton}
                    >
                        別のミッションを受ける
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <p className={styles.statusLabel}>（行動中）</p>

                <div className={styles.oracleBox}>
                    <p className={styles.oracleText}>{currentMission.text}</p>
                </div>

                <div className={styles.timeBox}>
                    <p className={styles.timeLabel}>経過時間</p>
                    <p className={styles.timeValue}>{elapsedMinutes}分</p>
                </div>

                <button onClick={handleRecord} className={styles.primaryButton}>
                    記録する
                </button>

                <button
                    onClick={() => {
                        setIsStarted(false);
                        setStartTime(null);
                        setElapsedMinutes(0);
                    }}
                    className={styles.secondaryButton}
                >
                    ⟹ 行動をキャンセルする
                </button>
            </main>
        </div>
    );
}
