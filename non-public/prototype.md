# prototype.net 提出用

## 作品ステータス

開発中

## 作品タイトル

Reborn - 日常を冒険に変える散歩アプリ

## 作品URL

https://sanposhin-reborn.vercel.app/

## 概要

ランダムに与えられたお題（ミッション）で日常の散歩を冒険に変えるPWA。お題に従って行動し、写真で記録。記録は「冒険の書」として蓄積され、振り返りも可能。

## ライセンスの設定

表示する：Creative Commons Attribution CC BY version 4.0 or later (CC BY 4+)


## 画像

## システム構成

```markdown
## システム構成

### フロントエンド
- **Next.js 15 (App Router)** - React フレームワーク
- **TypeScript** - 型安全な開発
- **CSS Modules** - スタイリング
- **PWA (Service Worker)** - オフライン対応
- **LocalStorage** - クライアントキャッシュ

### バックエンド
- **Next.js API Routes** - サーバーサイド処理
  - 認証 (signup, login)
  - ログ保存API
- **Firebase Admin SDK** - サーバー側Firebase操作

### データベース
- **Firebase Firestore** - Single Source of Truth (SSOT)
  - ユーザーデータ管理
  - 散歩ログ保存

### 外部サービス
- **Cloudinary** - 画像アップロード・管理・最適化
- **Google Gemini AI** - AIミッション生成（拡張機能）

### セキュリティ
- **bcrypt** - パスワードハッシュ化
- **CSP (Content Security Policy)** - XSS対策
- **レート制限** - API保護
- **入力サニタイズ** - インジェクション対策

### デプロイ
- **Vercel** - ホスティング・CI/CD
```

## 開発素材

- Next.js
- Firebase Cloud Firestore
- Cloudinary
- Gemini API
- TypeScript
- Vercel
- CSS

## タグ

- Next.js
- firebase
- 散歩アプリ
- 個人開発
- ライフスタイル
- PWA

## ストーリー

```markdown
# Reborn - 日常を冒険に変える散歩アプリ

## 🎯 作品の特徴

「Reborn」は、**日常の散歩に小さな意味を与える**位置情報連動型PWAアプリです。ランダムに与えられたお題（ミッション）に従って行動し、その瞬間を写真で記録することで、何気ない散歩が特別な体験に変わります。

---

## ✨ 主な機能

### 📜 お告げ機能（AIミッション生成）
Google Gemini AIが、ユーザーに合わせたパーソナライズされたミッションを生成。AI生成に失敗した場合でも、100個以上のフォールバックミッションから選択され、ユーザー体験を損ないません。

### 📸 写真撮影・記録保存
ミッションに従って撮影した写真は、Cloudinaryで最適化され高速配信。位置情報やメモと共に保存できます。

### 📚 冒険の書（アルバム）
過去の散歩記録を美しいグリッドレイアウトで閲覧。振り返ることで、自分の成長や変化を実感できます。

---

## 🛠 技術的こだわり

### 1. Single Source of Truth (SSOT) アーキテクチャ

<div style="background: #E3F2FD; padding: 20px; border-radius: 8px; margin: 20px 0;">

**Firestore を SSOT（真実の単一情報源）として設計**

- データベース: Firebase Firestore
- キャッシュ層: LocalStorage
- 同期: 自動・手動ハイブリッド方式

これにより、オフライン時でも快適に動作し、オンライン復帰時に自動同期されます。

</div>

```typescript
// データ同期の実装例
const syncLogs = async (userId: string) => {
    // Firestoreを真実の源泉として扱う
    const remoteLogs = await getLogsFromFirestore(userId);
    const localLogs = getLogsFromLocalStorage();
    
    // マージして両方に保存
    const mergedLogs = mergeLogs(remoteLogs, localLogs);
    await saveMergedLogs(mergedLogs);
}
```

```

