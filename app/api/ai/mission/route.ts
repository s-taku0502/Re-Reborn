import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRandomFallbackMission } from '@/data/fallbackMissions';

// 開発環境での SSL 証明書検証緩和（テスト用）
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 環境変数の取得（優先順位: AI_PROVIDER_API_KEY > GEMINI_API_KEY）
const GEMINI_API_KEY = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

const SYSTEM_PROMPT = `あなたは「散歩Reborn」という散歩アプリのミッション生成AIです。
ユーザーに散歩のミッションを与える役割を持っています。

## お題生成の制約:
1. 安全性: 危険な行為、違法行為、他人に迷惑をかける行為は絶対に避ける
2. 簡潔性: 50文字以内で具体的かつ実行可能
3. カテゴリ: "observe"(観察), "move"(移動), "mood"(気分)のいずれか
4. 難易度: 1-5（1=誰でも簡単、5=挑戦的）
5. ポジティブ: 楽しく、前向きな体験になるもの
6. 写真撮影: ユーザーはカメラでお題に沿っていると思う写真を撮る必要があることを考慮すること

## 出力形式（JSON）:
{
    "text": "お題の文章（50文字以内）",
    "category": "observe | move | mood",
    "difficulty": 1-5の数値,
    "reason": "このお題を選んだ理由（100文字以内）"
}

## 良い例:
- "公園で一番大きな木の写真を撮る"（observe, 2）
- "猫を見かけたら立ち止まって3秒眺める"（observe, 1）
- "いつもと違う道を1本選んで歩く"（move, 2）
- "空を見上げて深呼吸を3回する"（mood, 1）

## 避けるべき例:
- 他人の家を覗く（プライバシー侵害）
- 私有地に入る（不法侵入）
- 危険な場所に行く（安全性）
- 長時間かかるもの（散歩の範囲を超える）`;

function getRandomFallback() {
    const mission = getRandomFallbackMission();
    console.log('[AI Mission] 🔄 Using FALLBACK mission:', mission.text);
    return {
        id: `fallback_${Date.now()}`,
        ...mission,
        source: 'fallback',
        reason: 'AI生成に失敗したため、フォールバックミッションを使用しました',
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const context = body?.context || {};
        const timeOfDay = context.timeOfDay || 'day';
        const weather = context.weather || 'clear';

        // デバッグ情報
        console.log('[AI Mission] API Key exists:', !!GEMINI_API_KEY);
        console.log('[AI Mission] API Key prefix:', GEMINI_API_KEY?.substring(0, 10) + '...');

        // AI未設定の場合はフォールバック
        if (!GEMINI_API_KEY) {
            console.warn('[AI Mission] GEMINI_API_KEY not set, using fallback');
            return NextResponse.json(getRandomFallback());
        }

        console.log('[AI Mission] Attempting Gemini API call...');
        console.log('[AI Mission] Using model:', GEMINI_MODEL);

        // Google GenAI クライアント初期化（新SDK）
        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });

        const userPrompt = `現在の状況:
- 時間帯: ${timeOfDay}
- 天候: ${weather}

上記を考慮して、散歩のお題を1つ生成してください。JSON形式で返してください。`;

        const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

        // モデル名に models/ プレフィックスを付ける
        const modelName = GEMINI_MODEL.startsWith('models/') ? GEMINI_MODEL : `models/${GEMINI_MODEL}`;

        // リトライロジック付きAPI呼び出し
        let response: any;
        let lastError;
        const maxRetries = 3;
        const timeout = 15000; // 15秒

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                response = await Promise.race([
                    ai.models.generateContent({
                        model: modelName,
                        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('API timeout')), timeout)
                    )
                ]);

                clearTimeout(timeoutId);
                console.log('[AI Mission] Gemini API response received');
                break;
            } catch (error: any) {
                lastError = error;
                console.warn(`[AI Mission] API call attempt ${attempt}/${maxRetries} failed:`, error.message);

                if (attempt < maxRetries) {
                    // 指数バックオフ: 1秒 → 2秒 → 4秒
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('[AI Mission] All retry attempts failed, using fallback');
                    return NextResponse.json(getRandomFallback());
                }
            }
        }

        if (!response) {
            console.error('[AI Mission] No response from Gemini API, using fallback');
            return NextResponse.json(getRandomFallback());
        }

        const content = response.text();

        if (!content) {
            console.warn('[AI Mission] Empty response from Gemini');
            return NextResponse.json(getRandomFallback());
        }

        console.log('[AI Mission] Response content:', content);

        // JSON 抽出（Gemini がマークダウンでラップすることがあるため）
        let jsonStr = content;
        const jsonMatch = content.match(/\{[^{}]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const missionData = JSON.parse(jsonStr);

        // バリデーション
        if (!missionData.text || !missionData.category || !missionData.difficulty) {
            console.warn('[AI Mission] Invalid mission data:', missionData);
            return NextResponse.json(getRandomFallback());
        }

        if (missionData.text.length > 50) {
            missionData.text = missionData.text.substring(0, 50);
        }

        console.log('[AI Mission] Successfully generated AI mission');

        const aiMission = {
            id: `ai_${Date.now()}`,
            text: missionData.text,
            category: missionData.category,
            difficulty: Number(missionData.difficulty) || 2,
            source: 'ai',
            reason: missionData.reason || 'AI生成',
        };

        console.log('[AI Mission] ✨ AI Generated mission:', aiMission.text);

        return NextResponse.json(aiMission);
    } catch (error) {
        console.error('[AI Mission] ❌ Generate mission API error:', error);
        const fallback = getRandomFallback();
        return NextResponse.json(fallback);
    }
}
