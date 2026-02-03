# michikusa_memory

日常の散歩を、**ミッション**によって非日常の冒険に変える位置情報連動型PWA。

## 🎯 コンセプト

ユーザーはランダムに与えられたお題に従って行動し、その結果を写真とともに記録します。記録は「冒険の書（アルバム）」として蓄積され、後から振り返ることができます。

## ✨ 主な機能（MVP）

- 📜 **ミッション機能**: ランダムにミッションを受け取る
- 📸 **写真撮影・保存**: ミッションに従って行動し、写真で記録
- 📚 **冒険の書（アルバム）**: 過去の記録を一覧・詳細表示、個別削除
- 👤 **ユーザー管理**: ID設定、ログイン、バックアップ・復元機能
- 🔐 **セキュリティ**: サーバー側検証、レート制限、CSP対応
- 💾 **データ管理**: Firestore（SSOT）+ LocalStorageキャッシュ

## 🛠 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: CSS Modules
- **データ管理**: Firebase Firestore (SSOT) + LocalStorageキャッシュ
- **画像管理**: Cloudinary (動的変換・最適化)
- **認証**: bcrypt + サーバー側検証 (API Routes)
- **AI**: Google Generative AI (Gemini API) - ミッション生成
- **セキュリティ**: CSP, レート制限, 入力サニタイズ
- **PWA**: Progressive Web App 対応

## 🌍 外部API

- **Google Generative AI (Gemini API)**: AI ミッション生成。ユーザーの時間帯・天候・位置情報・タイムゾーンに基づいてパーソナライズされたミッションを自動生成
- **Nominatim (Open Street Map)**: リバースジオコーディング。ユーザーの緯度経度から国コードと地域情報を取得
- **WorldTimeAPI**: タイムゾーン取得。ユーザーの位置情報から現地時間とタイムゾーン情報を取得し、明るさレベルを自動判定

## 📦 セットアップ

### 依存関係をインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 環境変数の設定

Firebase と Cloudinary を使用するため、`.env.sample` を `.env.local` にコピーして設定してください。

```bash
cp .env.sample .env.local
```

**必須の環境変数**:

- Firebase クライアント設定 (`NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin 設定 (`FIREBASE_ADMIN_*`) - サーバー側API用
- Cloudinary 設定 (`NEXT_PUBLIC_CLOUDINARY_*`)
- Gemini API キー (`AI_PROVIDER_API_KEY`) - AI ミッション生成用

※ `.env.sample` は環境変数名のみを示すテンプレートファイルです（値は空）

## 🚀 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

## 📱 使い方

1. **初回起動**: ユーザーIDとバックアップパスワード（6桁）を設定
2. **ミッションを受ける**: ホーム画面から「ミッションを受ける」をタップ
3. **行動する**: 表示されたミッションに従って散歩・行動
4. **記録する**: 写真を撮影し、場所やメモを追加して保存
5. **振り返る**: 冒険の書（アルバム）で過去の記録を閲覧

## 🗂 ディレクトリ構造

```
michikusa_memory/
├── app/                    # Next.js App Router
│   ├── api/               # サーバー側API Routes
│   │   ├── auth/         # 認証 (signup, login)
│   │   └── logs/         # ログ保存
│   ├── page.tsx           # ホーム画面
│   ├── setup/             # 初期設定・ログイン画面
│   ├── oracle/            # ミッション表示画面
│   ├── record/            # 記録保存画面
│   ├── album/             # アルバム画面
│   └── mypage/            # マイページ
├── data/                  # データファイル
│   └── missions.json      # ミッションマスターデータ
├── lib/                   # ユーティリティ
│   ├── types.ts          # 型定義
│   ├── firebase.ts       # Firebase クライアント設定
│   ├── firebase-admin.ts # Firebase Admin 設定
│   ├── validation.ts     # 入力検証・サニタイズ
│   ├── cloudinary.ts     # 画像アップロード
│   └── errorHandler.ts   # エラーハンドリング・モーダル
└── public/                # 静的ファイル
    ├── manifest.json      # PWA manifest
    └── offline.html       # オフラインページ
```

## � API Routes

- **POST /api/auth/signup**: ユーザー登録（レート制限: 10/hour/IP）
- **POST /api/auth/login**: ユーザーログイン（レート制限: 5/15min/IP+userId, 15分ロック）
- **POST /api/logs/save**: ログ保存（レート制限: 100/hour/userId）
- **POST /api/ai/mission**: AI ミッション生成（Gemini API、フォールバック対応）
- **POST /api/cloudinary/delete**: ユーザーの Cloudinary 画像一括削除（アカウント削除時に使用）

## �🔐 セキュリティ対策

- **CSP（Content Security Policy）**: XSS攻撃の防止
- **入力サニタイズ**: 制御文字除去、文字数制限
- **レート制限**:
  - ログイン: 5回失敗で15分ロック（IP+ユーザーID単位）
  - サインアップ: 1時間に10回まで（IP単位）
  - ログ保存: 1時間に100回まで（ユーザー単位）
- **サーバー側検証**: 認証・保存は全てAPI Routes経由
- **パスワードハッシュ化**: bcrypt (salt=10)
- **画像URL検証**: Cloudinary許可ドメインのみ表示

## 🎨 デザイン原則

- **1画面1行動**: シンプルで直感的なUI
- **余白重視**: テキストが主役、UIは背景
- **静謐なトーン**: ユーザーを急かさない落ち着いたデザイン

## 🔮 今後の拡張予定

- AI によるパーソナライズされたミッション生成
- ソーシャル機能（フォロー・公開範囲設定）
- より高度な位置情報の活用
- 時間帯・天候に応じたミッション変化
- プッシュ通知

## 📄 ライセンス

個人開発プロジェクト

---

**michikusa_memory** - 今日の散歩に、小さな意味を。
