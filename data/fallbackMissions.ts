/**
 * フォールバックミッション
 * AI生成に失敗した場合に使用される予備のミッション集
 */

export interface FallbackMission {
    text: string;
    category: 'observe' | 'move' | 'mood';
    difficulty: 1 | 2 | 3 | 4 | 5;
}

export const FALLBACK_MISSIONS: FallbackMission[] = [
    // observe（観察）系 - 難易度1
    { text: '空を見上げて雲の形を撮影する', category: 'observe', difficulty: 1 },
    { text: '道端の花や植物を1つ見つけて撮る', category: 'observe', difficulty: 1 },
    { text: '鳥を見つけて撮影する', category: 'observe', difficulty: 1 },
    { text: '今日の空の色を写真に収める', category: 'observe', difficulty: 1 },
    { text: '道に落ちている葉っぱを撮影する', category: 'observe', difficulty: 1 },
    { text: '周りに咲いている花を撮る', category: 'observe', difficulty: 1 },
    { text: '木の幹の模様を接写する', category: 'observe', difficulty: 1 },
    { text: '空に飛んでいる鳥を撮影する', category: 'observe', difficulty: 1 },

    // observe（観察）系 - 難易度2
    { text: '猫を見かけたら写真を撮る', category: 'observe', difficulty: 2 },
    { text: '公園で一番大きな木の写真を撮る', category: 'observe', difficulty: 2 },
    { text: '珍しい色の花を見つけて撮影する', category: 'observe', difficulty: 2 },
    { text: '同じ種類の花を3つ見つけて撮る', category: 'observe', difficulty: 2 },
    { text: '虫や小動物を静かに撮影する', category: 'observe', difficulty: 2 },
    { text: '面白い形の雲を見つけて写真を撮る', category: 'observe', difficulty: 2 },
    { text: '季節を感じるものを撮影する', category: 'observe', difficulty: 2 },

    // observe（観察）系 - 難易度3
    { text: '今まで気づかなかった建物や看板を撮る', category: 'observe', difficulty: 3 },
    { text: '5種類の異なる植物を見つけて撮影する', category: 'observe', difficulty: 3 },
    { text: '面白い形の石や木の枝を撮影する', category: 'observe', difficulty: 3 },
    { text: '珍しい鳥を見つけて撮影する', category: 'observe', difficulty: 3 },

    // move（移動）系 - 難易度1
    { text: 'いつもと違う景色を1枚撮る', category: 'move', difficulty: 1 },
    { text: '後ろを振り返って景色を撮影する', category: 'move', difficulty: 1 },
    { text: '信号待ちの風景を撮影する', category: 'move', difficulty: 1 },
    { text: '木を別の角度から撮影する', category: 'move', difficulty: 1 },

    // move（移動）系 - 難易度2
    { text: 'いつもと違う道の景色を撮る', category: 'move', difficulty: 2 },
    { text: '普段通らない小道の風景を撮影する', category: 'move', difficulty: 2 },
    { text: '曲がり角の景色を撮影する', category: 'move', difficulty: 2 },
    { text: '坂道から見える景色を撮影する', category: 'move', difficulty: 2 },
    { text: '公園のベンチからの景色を撮る', category: 'move', difficulty: 2 },
    { text: '100歩先の景色を撮影する', category: 'move', difficulty: 2 },

    // move（移動）系 - 難易度3
    { text: '知らない道の風景を撮影する', category: 'move', difficulty: 3 },
    { text: '新しいルートの景色を記録する', category: 'move', difficulty: 3 },
    { text: '階段から見える景色を撮影する', category: 'move', difficulty: 3 },
    { text: '遠回りした道の景色を撮る', category: 'move', difficulty: 3 },

    // move（移動）系 - 難易度4
    { text: '目的地までの道のりを撮影する', category: 'move', difficulty: 4 },
    { text: '往復で違う風景を2枚撮る', category: 'move', difficulty: 4 },

    // mood（気分）系 - 難易度1
    { text: '心が落ち着く景色を撮影する', category: 'mood', difficulty: 1 },
    { text: '静かな場所を見つけて撮る', category: 'mood', difficulty: 1 },
    { text: '今日良かったことを思い出す景色を撮る', category: 'mood', difficulty: 1 },
    { text: '笑顔になれる風景を撮影する', category: 'mood', difficulty: 1 },
    { text: '癒される景色を撮影する', category: 'mood', difficulty: 1 },
    { text: '好きな風景を撮影する', category: 'mood', difficulty: 1 },

    // mood（気分）系 - 難易度2
    { text: '静寂を感じる場所を撮影する', category: 'mood', difficulty: 2 },
    { text: '感謝したくなる景色を撮る', category: 'mood', difficulty: 2 },
    { text: '心に残る風景を撮影する', category: 'mood', difficulty: 2 },
    { text: '今日の気分を表す景色を撮る', category: 'mood', difficulty: 2 },
    { text: '自然の美しさを感じる景色を撮る', category: 'mood', difficulty: 2 },
    { text: '穏やかな気持ちになれる風景を撮る', category: 'mood', difficulty: 2 },

    // mood（気分）系 - 難易度3
    { text: '自分らしさを表現できる景色を撮る', category: 'mood', difficulty: 3 },
    { text: '季節の良さを感じる風景を撮影する', category: 'mood', difficulty: 3 },
    { text: '思い出に残したい景色を撮影する', category: 'mood', difficulty: 3 },
    { text: '今日1日を象徴する景色を撮る', category: 'mood', difficulty: 3 },

    // 時間制約付きミッション - move系
    { text: '3分歩いた先の景色を撮影する', category: 'move', difficulty: 2 },
    { text: '5分歩いた先のお店を撮影する', category: 'move', difficulty: 3 },
    { text: '10分歩いた先の建物を撮る', category: 'move', difficulty: 3 },
    { text: '2分以内に面白いものを見つけて撮る', category: 'observe', difficulty: 2 },
    { text: '5分以内に花を3つ見つけて撮影する', category: 'observe', difficulty: 3 },
    { text: '7分歩いた先の公園や広場を撮影する', category: 'move', difficulty: 3 },
    { text: '3分後の景色を記録する', category: 'move', difficulty: 2 },
    { text: '5分間歩いて一番気に入った景色を撮る', category: 'mood', difficulty: 3 },
    { text: '10分後に到着した場所を撮影する', category: 'move', difficulty: 4 },
    { text: '8分歩いた先の交差点の景色を撮る', category: 'move', difficulty: 3 },
    { text: '4分以内に赤いものを見つけて撮影する', category: 'observe', difficulty: 3 },
    { text: '6分歩いた先のお気に入りスポットを撮る', category: 'move', difficulty: 3 },
    { text: '15分歩いた先のお店を撮影する', category: 'move', difficulty: 4 },
    { text: '3分以内に癒される景色を見つけて撮る', category: 'mood', difficulty: 2 },
];

/**
 * ランダムなフォールバックミッションを取得
 */
export function getRandomFallbackMission(): FallbackMission {
    return FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)];
}
