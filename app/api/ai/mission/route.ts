import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRandomFallbackMission } from '@/data/fallbackMissions';

// 開発環境での SSL 証明書検証緩和（テスト用）
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 環境変数の取得（優先順位: AI_PROVIDER_API_KEY > GEMINI_API_KEY）
const GEMINI_API_KEY = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY;
// モデル名を環境変数から取得。未設定の場合は 'gemini-1.5-flash-latest' を使用
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

const SYSTEM_PROMPT = `あなたは「michikusa_memory」という散歩アプリのミッション生成AIです。
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
        if (GEMINI_API_KEY) {
            console.log('[AI Mission] API Key prefix:', GEMINI_API_KEY.substring(0, 10) + '...');
        }

        // AI未設定の場合はフォールバック
        if (!GEMINI_API_KEY) {
            console.warn('[AI Mission] GEMINI_API_KEY not set, using fallback');
            return NextResponse.json(getRandomFallback());
        }

        console.log('[AI Mission] Attempting Gemini API call...');
        console.log('[AI Mission] Using model:', GEMINI_MODEL);

        // Google Generative AI クライアント初期化
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            safetySettings: [ // 安全性設定を追加
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
        });

        const userPrompt = `現在の状況:
- 時間帯: ${timeOfDay}
- 天候: ${weather}

上記を考慮して、散歩のお題を1つ生成してください。JSON形式で返してください。`;

        const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

        // API呼び出し
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const content = response.text();

        if (!content) {
            console.warn('[AI Mission] Empty response from Gemini, using fallback');
            return NextResponse.json(getRandomFallback());
        }

        console.log('[AI Mission] Response content:', content);

        // JSON 抽出（Gemini がマークダウンでラップすることがあるため）
        let jsonStr = content;
        const jsonMatch = content.match(/```(json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            jsonStr = jsonMatch[2];
        } else {
            // フォールバックとして、最初の `{` と最後の `}` で囲まれた部分を抽出
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }
        }

        let missionData;
        try {
            missionData = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('[AI Mission] Failed to parse JSON from response, using fallback.', parseError);
            console.error('[AI Mission] Original content:', content);
            return NextResponse.json(getRandomFallback());
        }


        // バリデーション
        if (!missionData.text || !missionData.category || !missionData.difficulty) {
            console.warn('[AI Mission] Invalid mission data received from AI:', missionData);
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
            reason: missionData.reason || 'AIが現在の状況に合わせて生成しました',
        };

        console.log('[AI Mission] ✨ AI Generated mission:', aiMission.text);

        return NextResponse.json(aiMission);
    } catch (error) {
        console.error('[AI Mission] ❌ Generate mission API error:', error);
        // エラーがAPIからのものか、それ以外かを判断
        if (error instanceof Error) {
            console.error('[AI Mission] Error message:', error.message);
        }
        const fallback = getRandomFallback();
        return NextResponse.json(fallback);
    }
}
