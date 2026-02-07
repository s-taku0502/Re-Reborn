import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { validateLocation, validateMemo, sanitizeTextInput } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS_PER_USER = 100;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

type AttemptState = {
    count: number;
    firstAt: number;
};

const attempts = new Map<string, AttemptState>();

function checkRateLimit(userId: string, now: number): { allowed: boolean } {
    const state = attempts.get(userId);
    if (!state) return { allowed: true };
    if (now - state.firstAt > WINDOW_MS) {
        attempts.delete(userId);
        return { allowed: true };
    }
    if (state.count >= MAX_ATTEMPTS_PER_USER) {
        return { allowed: false };
    }
    return { allowed: true };
}

function registerAttempt(userId: string, now: number) {
    const state = attempts.get(userId);
    if (!state || now - state.firstAt > WINDOW_MS) {
        attempts.set(userId, { count: 1, firstAt: now });
        return;
    }
    attempts.set(userId, { count: state.count + 1, firstAt: state.firstAt });
}

function removeUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(removeUndefined) as T;
    }

    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
            if (val === undefined) return;
            const cleaned = removeUndefined(val);
            if (cleaned !== undefined) {
                result[key] = cleaned;
            }
        });
        return result as T;
    }

    return value;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const userId = String(body?.userId || '').trim();
        const missionId = String(body?.missionId || '').trim();
        const missionText = String(body?.missionText || '').trim();
        const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : undefined;
        const imageData = body?.imageData ? String(body.imageData) : undefined;
        const imageSource = body?.imageSource === 'camera'
            ? 'camera'
            : body?.imageSource === 'gallery'
                ? 'gallery'
                : undefined;
        const imageCapturedAt = body?.imageCapturedAt ? String(body.imageCapturedAt) : undefined;
        const imageExifAvailable = typeof body?.imageExifAvailable === 'boolean'
            ? Boolean(body.imageExifAvailable)
            : undefined;
        const imageFlagReasons = Array.isArray(body?.imageFlagReasons)
            ? body.imageFlagReasons
                .filter((item: unknown) => typeof item === 'string')
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
            : undefined;
        const imageFlagged = imageFlagReasons ? imageFlagReasons.length > 0 : undefined;
        const locationName = body?.location?.name ? sanitizeTextInput(String(body.location.name)) : undefined;
        const memo = body?.memo ? sanitizeTextInput(String(body.memo)) : undefined;
        const isPublic = Boolean(body?.isPublic);
        const status = body?.status === 'cancelled' ? 'cancelled' : 'completed'; // ステータス追加

        if (!userId || !missionId || !missionText) {
            return NextResponse.json(
                { ok: false, code: 'INVALID_INPUT', message: '必須項目が不足しています' },
                { status: 400 }
            );
        }

        if (locationName) {
            const locationValidation = validateLocation(locationName);
            if (!locationValidation.valid) {
                return NextResponse.json(
                    { ok: false, code: 'INVALID_INPUT', message: locationValidation.error },
                    { status: 400 }
                );
            }
        }

        if (memo) {
            const memoValidation = validateMemo(memo);
            if (!memoValidation.valid) {
                return NextResponse.json(
                    { ok: false, code: 'INVALID_INPUT', message: memoValidation.error },
                    { status: 400 }
                );
            }
        }

        const now = Date.now();
        const limit = checkRateLimit(userId, now);
        if (!limit.allowed) {
            return NextResponse.json(
                { ok: false, code: 'RATE_LIMIT', message: '保存試行回数が多すぎます' },
                { status: 429 }
            );
        }

        registerAttempt(userId, now);

        const db = getAdminFirestore();
        const userRef = db.collection('users').doc(userId);
        const logsRef = userRef.collection('logs');

        const logData: Record<string, unknown> = {
            userId,
            missionId,
            missionText,
            imageUrl,
            imageData,
            imageSource,
            imageCapturedAt,
            imageExifAvailable,
            imageFlagReasons,
            imageFlagged,
            location: locationName ? { name: locationName } : undefined,
            memo,
            isPublic,
            status, // ステータスを追加
            createdAt: new Date().toISOString(),
        };

        const cleanedLog = removeUndefined(logData);
        const docRef = await logsRef.add(cleanedLog);

        // totalAdventures をインクリメント（完了したミッションのみカウント）
        if (status === 'completed') {
            const userSnap = await userRef.get();
            if (userSnap.exists) {
                const currentTotal = (userSnap.data()?.totalAdventures as number) || 0;
                await userRef.set({ totalAdventures: currentTotal + 1 }, { merge: true });
            }
        }

        return NextResponse.json({ ok: true, logId: docRef.id });
    } catch (error) {
        console.error('Save log API error:', error);
        return NextResponse.json(
            { ok: false, code: 'SERVER_ERROR', message: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
