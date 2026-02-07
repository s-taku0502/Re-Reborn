# みちくさメモリー (michikusa_memory)

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-orange)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com/)

日常の散歩を、**AI生成ミッション**によって非日常の冒険に変える位置情報連動型PWA。

**公式URL**: [https://michikusa-memory.com](https://michikusa-memory.com)

## コンセプト

ユーザーはAIが生成したパーソナライズされたミッション（お題）に従って行動し、その結果を写真とともに記録します。記録は「冒険の書（アルバム）」として蓄積され、後から振り返ることができます。

---

## 主な機能

### ユーザー向け機能

- **AIミッション生成**: Google Gemini APIによる位置情報・時間帯・明るさレベルを考慮したパーソナライズミッション
- **写真撮影・保存**: クライアント側で自動圧縮（1024x1024, 80%品質）し、Cloudinaryへ即座にアップロード
- **冒険の書（アルバム）**: 過去の記録を一覧・詳細表示、個別削除
- **ユーザー管理**: ID設定、ログイン、バックアップ・復元機能、アカウント削除（GDPR準拠）
- **データ管理**: Firestore（SSOT）+ LocalStorageキャッシュによるオフライン対応
- **PWA対応**: ServiceWorkerによるオフライン閲覧、プッシュ通知対応準備
- **お問い合わせ**: ユーザーからのフィードバック・サポート依頼受付

### 管理者向け機能（/admin）

- **管理者認証**: JWT認証、役割ベースアクセス制御（superadmin/admin/moderator）
- **ダッシュボード**: ユーザー数、ログ数、お問い合わせ数などのリアルタイム統計
- **お問い合わせ管理**: ステータス管理、担当者割り当て、管理者メモ
- **ユーザー管理**: ユーザー一覧・詳細閲覧、統計情報
- **ログ管理**: ユーザーログの閲覧・モデレーション・削除
- **統計・分析**: 日次・月次統計、アクティブユーザー推移
- **システム設定**: メンテナンスモード、機能フラグ、広告設定
- **監査ログ**: 管理者操作の記録・追跡
- **管理者管理**: 管理者アカウントの作成・編集・削除（superadminのみ）

---

## 技術スタック

### フロントエンド

- **フレームワーク**: Next.js 15.5.11 (App Router)
- **言語**: TypeScript 5.x
- **UIライブラリ**: React 19.2.4
- **スタイリング**: CSS Modules + PostCSS
- **PWA**: next-pwa 5.6.0 + Service Worker

### バックエンド・インフラ

- **ホスティング**: Vercel
- **データベース**: Firebase Firestore
- **認証**: Firebase Authentication（匿名ログイン）+ Firestore独自認証（bcryptjs）
- **画像管理**: Cloudinary CDN（自動圧縮・最適化）
- **AI**: Google Generative AI (Gemini 1.5)
- **位置情報**: Nominatim (OpenStreetMap) リバースジオコーディング
- **画像圧縮**: exifr（メタデータ抽出）+ クライアント側Canvas圧縮

### セキュリティ

- **CSP（Content Security Policy）**: XSS攻撃防止
- **レート制限**: ログイン（5回/15分）、サインアップ（10回/時間）、ログ保存（100回/時間）
- **入力サニタイズ**: 制御文字除去、文字数制限（memo: 500文字、location: 200文字）
- **パスワード**: bcrypt ハッシュ化（salt=10）
- **画像URL検証**: Cloudinary許可ドメインのみ表示
- **セキュリティヘッダー**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy

---

## 外部API・サービス

| サービス | 用途 | 詳細 |
|---------|------|------|
| **Google Generative AI (Gemini API)** | AIミッション生成 | ユーザーの位置情報・時間帯・明るさレベルに基づいてパーソナライズされたミッションを自動生成 |
| **Nominatim (OpenStreetMap)** | リバースジオコーディング | 緯度経度から国コード・地域名を取得 |
| **Cloudinary** | 画像管理・CDN | 画像の自動最適化・圧縮・配信、変換パラメータによる動的リサイズ |
| **Firebase Firestore** | データベース | NoSQLデータベース、リアルタイム同期 |
| **Firebase Authentication** | ユーザー認証 | ユーザーID・パスワード認証 |
| **ブラウザ標準API** | タイムゾーン・位置情報 | Intl.DateTimeFormat, Geolocation API |

---

## セットアップ

### 前提条件

- Node.js 18.x 以上
- npm 10.x 以上
- Firebase プロジェクト（Firestore, Authentication, Storage）
- Cloudinary アカウント
- Google AI Studio アカウント（Gemini API）

### 1. リポジトリのクローン

```bash
git clone https://github.com/s-taku0502/Re-Reborn.git
cd sanpo-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Firebase クライアント設定
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK（サーバー側API用）
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Generative AI (Gemini)
AI_PROVIDER_API_KEY=your_gemini_api_key

# 管理者初期セットアップトークン（最初のsuperadmin作成用）
ADMIN_SETUP_TOKEN=your_random_32_char_token
```

**セキュリティ注意事項**:

- `.env.local` は `.gitignore` に含まれており、リポジトリにコミットされません
- 本番環境では Vercel の環境変数設定を使用してください
- `ADMIN_SETUP_TOKEN` は十分に複雑なランダム文字列を使用してください

### 4. Firebase Firestore の設定

1. Firebase Console で Firestore Database を有効化
2. Security Rules を設定（`firestore.rules` を参照）
3. インデックスを作成（`firestore.indexes.json` を参照）

```bash
# Firebase CLIでデプロイ
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

### 6. 管理者アカウントの初期設定

初回のみ、以下のAPIを呼び出して最初のsuperadminアカウントを作成します：

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "1234567",
    "displayName": "システム管理者",
    "setupToken": "your_ADMIN_SETUP_TOKEN"
  }'
```

その後、[http://localhost:3000/admin/login](http://localhost:3000/admin/login) からログインできます。

---

## 使い方

### ユーザー向け

1. **初回起動**: [https://michikusa-memory.com](https://michikusa-memory.com) にアクセス
2. **アカウント作成**: ユーザーIDとパスワード（7桁の数字）を設定
3. **ミッションを受ける**: ホーム画面から「ミッションを受ける」をタップ（位置情報の許可が必要）
4. **行動する**: AIが生成したパーソナライズミッションに従って散歩・行動
5. **記録する**: 写真を撮影（またはギャラリーから選択）し、場所やメモを追加して保存
6. **振り返る**: 冒険の書（アルバム）で過去の記録を閲覧・削除

### 管理者向け

1. **ログイン**: [https://michikusa-memory.com/admin/login](https://michikusa-memory.com/admin/login)
2. **ダッシュボード閲覧**: ユーザー数、ログ数、お問い合わせ数などの統計を確認
3. **お問い合わせ対応**: お問い合わせ一覧から対応状況を管理
4. **ユーザー管理**: ユーザー詳細・統計情報の閲覧
5. **ログ管理**: 不適切なログの削除・モデレーション
6. **システム設定**: メンテナンスモード、機能フラグの変更（superadminのみ）

---

## 🗂 ディレクトリ構造

```
sanpo-app/
├── app/                           # Next.js App Router
│   ├── api/                      # サーバー側API Routes
│   │   ├── admin/               # 管理者API
│   │   │   ├── auth/           # 管理者認証（login, setup）
│   │   │   ├── contacts/       # お問い合わせ管理
│   │   │   ├── dashboard/      # ダッシュボード統計
│   │   │   ├── logs/           # ログ管理
│   │   │   ├── settings/       # システム設定
│   │   │   ├── statistics/     # 統計・分析
│   │   │   └── users/          # ユーザー管理
│   │   ├── ai/                  # AI ミッション生成
│   │   ├── auth/                # ユーザー認証（signup, login）
│   │   ├── cloudinary/          # 画像削除
│   │   ├── contact/             # お問い合わせ送信
│   │   ├── geocode/             # リバースジオコーディング
│   │   ├── logs/                # ログ保存
│   │   └── settings/            # 設定取得
│   ├── admin/                    # 管理者画面
│   │   ├── login/               # 管理者ログイン
│   │   ├── page.tsx             # ダッシュボード
│   │   ├── audit-logs/          # 監査ログ
│   │   ├── contacts/            # お問い合わせ管理
│   │   ├── logs/                # ログ管理
│   │   ├── manage-admins/       # 管理者管理
│   │   ├── settings/            # システム設定
│   │   ├── statistics/          # 統計・分析
│   │   └── users/               # ユーザー管理
│   ├── album/                    # アルバム画面
│   ├── contact/                  # お問い合わせページ
│   ├── mypage/                   # マイページ
│   ├── oracle/                   # ミッション表示画面
│   ├── record/                   # 記録保存画面
│   ├── setup/                    # 初期設定・ログイン画面
│   ├── components/               # 共通コンポーネント
│   ├── globals.css              # グローバルスタイル
│   ├── layout.tsx               # ルートレイアウト（メタデータ・SEO）
│   └── page.tsx                 # ホーム画面
├── data/                         # データファイル
│   ├── fallbackMissions.ts      # フォールバック用ミッション
│   └── missions.json            # ミッションマスターデータ
├── lib/                          # ユーティリティ・ロジック
│   ├── admin-*.ts               # 管理者向けユーティリティ
│   ├── cloudinary.ts            # 画像アップロード
│   ├── errorHandler.ts          # エラーハンドリング・モーダル
│   ├── firebase.ts              # Firebase クライアント
│   ├── firebase-admin.ts        # Firebase Admin SDK
│   ├── firestore.ts             # Firestore操作
│   ├── geolocation.ts           # 位置情報取得
│   ├── imageCompression.ts      # 画像圧縮
│   ├── imageMetadata.ts         # EXIF メタデータ抽出
│   ├── imageSelection.ts        # ギャラリー画像選択
│   ├── password.ts              # パスワードハッシュ化
│   ├── types.ts                 # 型定義
│   └── validation.ts            # 入力検証・サニタイズ
├── non-public/                   # ドキュメント（リポジトリのみ）
│   ├── admin_requirements.md    # 管理者機能要件定義書
│   ├── requirements_definition.md  # ユーザー機能要件定義書
│   ├── technical_specification.md  # 技術仕様書
│   ├── SECURITY_REVIEW.md       # セキュリティレビュー
│   ├── SEO_ENHANCEMENT.md       # SEO対策実装ログ
│   └── *.md                     # その他設計ドキュメント
├── public/                       # 静的ファイル
│   ├── icons/                   # アプリアイコン
│   ├── manifest.json            # PWA マニフェスト
│   ├── sw.js                    # Service Worker
│   ├── offline.html             # オフラインページ
│   └── robots.txt               # クローラー制御
├── firebase.json                 # Firebase設定
├── firestore.rules              # Firestore Security Rules
├── firestore.indexes.json       # Firestoreインデックス
├── next.config.ts               # Next.js設定
├── package.json                 # 依存関係
├── tsconfig.json                # TypeScript設定
└── vercel.json                  # Vercelデプロイ設定
```

---

## 🔌 API Routes

### ユーザー向けAPI

| エンドポイント | メソッド | 説明 | レート制限 |
|--------------|---------|------|-----------|
| `/api/auth/signup` | POST | ユーザー登録 | 10回/時間/IP |
| `/api/auth/login` | POST | ユーザーログイン | 5回/15分/IP+userId |
| `/api/logs/save` | POST | ログ保存 | 100回/時間/userId |
| `/api/ai/mission` | POST | AIミッション生成 | - |
| `/api/cloudinary/delete` | POST | ユーザー画像一括削除 | - |
| `/api/contact/submit` | POST | お問い合わせ送信 | - |
| `/api/geocode/reverse` | POST | リバースジオコーディング | - |
| `/api/settings/get` | GET | システム設定取得 | - |

### 管理者向けAPI

| エンドポイント | メソッド | 説明 | 権限 |
|--------------|---------|------|------|
| `/api/admin/setup` | POST | 初期superadmin作成 | setupToken |
| `/api/admin/auth/login` | POST | 管理者ログイン | - |
| `/api/admin/dashboard/stats` | GET | ダッシュボード統計 | admin+ |
| `/api/admin/contacts` | GET | お問い合わせ一覧 | admin+ |
| `/api/admin/contacts/[id]` | GET/PUT | お問い合わせ詳細・更新 | admin+ |
| `/api/admin/users` | GET | ユーザー一覧 | admin+ |
| `/api/admin/users/[id]` | GET | ユーザー詳細 | admin+ |
| `/api/admin/logs` | GET | ログ一覧 | moderator+ |
| `/api/admin/logs/[id]` | DELETE | ログ削除 | moderator+ |
| `/api/admin/statistics/daily` | GET | 日次統計 | admin+ |
| `/api/admin/statistics/monthly` | GET | 月次統計 | admin+ |
| `/api/admin/settings` | GET/PUT | システム設定 | superadmin |

**権限レベル**:

- `moderator+`: moderator, admin, superadmin
- `admin+`: admin, superadmin
- `superadmin`: superadmin のみ

---

## 🔐 セキュリティ対策

### 認証アーキテクチャ

本アプリは、**Firebase Authentication（匿名ログイン）** と **カスタム認証（Firestore DB）** を組み合わせたハイブリッド認証を採用しています。

**仕組み:**

1. **Firebase Authentication** - 匿名ログインでセッション管理とFirestore接続を確立
2. **カスタム認証** - アプリケーション層でユーザーID+パスワードハッシュ（bcrypt）による認証
3. **Firestore Security Rules** - `request.auth != null` で匿名認証済みをチェック
4. **API層** - `/api/auth/login` でユーザーID/パスワードの照合

**メリット:**

- Firestoreへの安全なアクセス（匿名認証による保護）
- 柔軟なユーザー管理（独自のユーザーID体系）
- パスワードリセット・バックアップ機能の独自実装が可能

### 実装済みのセキュリティ機能

#### 1. コンテンツセキュリティポリシー（CSP）

- **X-Frame-Options**: クリックジャッキング防止
- **X-Content-Type-Options**: MIME タイプスニッフィング防止
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Content-Security-Policy**: XSS攻撃の影響範囲を制限
- **Permissions-Policy**: カメラ・位置情報などの機能アクセス制御

#### 2. 入力検証・サニタイズ

- **制御文字除去**: `\x00-\x1F\x7F` の制御文字を自動削除
- **文字数制限**:
  - メモ: 最大500文字
  - 場所: 最大200文字
  - ユーザーID: 最大20文字
- **サーバー側検証**: すべての重要な操作でAPI Routes経由で検証

#### 3. レート制限

| 操作 | 制限 | 単位 | ロック期間 |
|------|------|------|-----------|
| ログイン | 5回/15分 | IP+userId | 15分 |
| サインアップ | 10回/時間 | IP | - |
| ログ保存 | 100回/時間 | userId | - |
| 復元試行 | 3回 | localStorage | 60分 |

#### 4. 認証・パスワード管理

- **Firebase Authentication**: 匿名ログインでセッション管理のみ
- **ユーザー認証**: FirestoreでユーザーID+パスワードハッシュによる独自実装
- **パスワードハッシュ化**: bcrypt (salt=10)
- **平文保存禁止**: パスワードは一切保存せず、ハッシュのみ
- **JWT認証**: 管理者セッションは有効期限8時間、無操作30分でタイムアウト

#### 5. 画像セキュリティ

- **許可ドメイン制御**: `res.cloudinary.com/{cloudName}/sanposhin/{userId}` のみ許可
- **自動圧縮**: クライアント側で1024x1024, 80%品質に圧縮してからアップロード
- **EXIF メタデータ検証**: 画像選択時の撮影時刻チェック（共有機能時）
- **画像URL検証**: 不正なURLはブロック

#### 6. Firebase Security Rules

```javascript
// 認証方式: Firebase Authentication（匿名ログイン）+ アプリケーション層でのカスタム認証
// - Firebase Auth: セッション管理のみ（request.auth != null で認証チェック）
// - カスタム認証: Firestore DBのユーザーID+パスワードハッシュで実装

// users コレクション
match /users/{userId} {
  // 匿名認証済みであれば読み書き可能
  // 注: 実際のユーザー認証はアプリケーション層で userId/password をチェック
  allow read, write: if request.auth != null;
  
  // logs サブコレクション
  match /logs/{logId} {
    allow read, write: if request.auth != null;
  }
}

// admins コレクション（管理者のみアクセス）
match /admins/{adminId} {
  allow read: if request.auth != null && request.auth.uid == adminId;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'superadmin';
}

// contacts コレクション（お問い合わせ）
match /contacts/{contactId} {
  allow read, update: if request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
  allow create: if true;  // 誰でも送信可能
}
```

### 今後の改善予定

- CSPの段階的厳格化（`unsafe-inline` を nonce/hash に置き換え）
- 依存パッケージの定期監査（Dependabot導入）
- HSTS設定（本番環境でのHTTPS強制）
- ログ監視・異常検知（大量保存・異常ログインの検知）
- 二要素認証（2FA）の導入

---

## 🎨 デザイン原則

### UIコンセプト

- **1画面1行動**: ユーザーが迷わないシンプルな導線
- **余白重視**: テキストを主役に、UIは背景に徹する
- **静謐なトーン**: ユーザーを急かさない落ち着いたデザイン
- **モバイルファースト**: スマートフォンでの操作性を最優先

### カラーパレット

- **プライマリ**: 草色（#7CB342）- 散歩・自然をイメージ
- **アクセント**: 空色（#4FC3F7）- 開放感・爽やかさ
- **テキスト**: ダークグレー（#333333）
- **背景**: オフホワイト（#F5F5F5）

### PWA対応

- **ステータスバー**: 空色（theme-color）
- **ナビゲーションバー**: 草色
- **アイコン**: 複数サイズ対応（72x72 - 512x512）
- **スプラッシュスクリーン**: manifest.jsonで自動生成

---

## 📊 Firestore データスキーマ

### ユーザーコレクション

```typescript
// users/{userId}
interface User {
  userId: string;              // ユーザーID
  passwordHash: string;        // bcryptハッシュ
  createdAt: string;          // ISO8601形式
  totalAdventures: number;    // 総冒険回数
  lastLoginAt: string;        // 最終ログイン日時
}

// users/{userId}/logs/{logId}
interface Log {
  missionText: string;        // ミッション内容
  imageUrl: string | null;    // Cloudinary画像URL
  location: {
    name: string;             // 地名
    lat: number;              // 緯度
    lng: number;              // 経度
  };
  memo: string;              // ユーザーメモ（最大500文字）
  status: 'completed' | 'cancelled';
  createdAt: string;         // ISO8601形式
  cloudinaryPublicId: string | null;  // 削除用ID
  duration: number | null;   // ミッション実行時間（秒）
}
```

### 管理者コレクション

```typescript
// admins/{adminId}
interface Admin {
  email: string;              // 管理者メールアドレス
  displayName: string;        // 表示名
  role: 'superadmin' | 'admin' | 'moderator';
  passwordHash: string;       // bcryptハッシュ
  permissions: string[];      // 権限リスト
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isActive: boolean;          // アカウント有効/無効
  createdBy: string;          // 作成者の管理者ID
}

// contacts/{contactId}
interface Contact {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'inProgress' | 'resolved' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
  userAgent: string;
  ip: string;
  adminNote: string | null;
  assignedTo: string | null;
  readAt: Timestamp | null;
}
```

詳細は [non-public/technical_specification.md](non-public/technical_specification.md) を参照してください。

---

## 🚀 デプロイ

### Vercel へのデプロイ

1. GitHub リポジトリと Vercel を連携
2. 環境変数を Vercel ダッシュボードで設定
3. `main` ブランチへのプッシュで自動デプロイ

```bash
# Vercel CLIを使う場合
npm install -g vercel
vercel --prod
```

### Firebase のデプロイ

```bash
# Firestore Rules & Indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### カスタムドメインの設定

1. Vercel ダッシュボードで「Domains」を開く
2. カスタムドメイン（例: `michikusa-memory.com`）を追加
3. DNSレコードを設定（Aレコード、CNAMEレコード）
4. SSL証明書が自動発行される

---

## 🧪 テスト

### 手動テスト

- ユーザー登録・ログインフロー
- ミッション生成（AI、フォールバック）
- 写真撮影・ギャラリー選択
- ログ保存・閲覧・削除
- バックアップ・復元
- アカウント削除

### 管理者機能テスト

- 管理者ログイン
- ダッシュボード表示
- お問い合わせ管理
- ユーザー・ログ管理

### 今後の導入予定

- ユニットテスト（Jest + React Testing Library）
- E2Eテスト（Playwright）
- CI/CD（GitHub Actions）

---

## 🔮 今後の拡張予定

### Phase 2（Q2 2026）

- [ ] より高度なAIミッション生成（天候・季節連動）
- [ ] プッシュ通知機能
- [ ] ソーシャル機能（フォロー・公開範囲設定）
- [ ] フィード機能（フォロワーのログ閲覧）

### Phase 3（Q3 2026）

- [ ] バッジ・実績システム
- [ ] ミッション投稿機能（ユーザー生成コンテンツ）
- [ ] 地図表示（訪問履歴の可視化）
- [ ] Google Analytics 4 連携

### Phase 4（Q4 2026）

- [ ] AI チャットボット（散歩相談）
- [ ] ARミッション（位置情報ゲーム要素）
- [ ] コミュニティ機能（グループ散歩）

---

## 📝 ライセンス

個人開発プロジェクト（非商用）

---

## 🤝 コントリビューション

現在は個人開発プロジェクトのため、外部からのコントリビューションは受け付けていません。

---

## 📧 お問い合わせ

アプリ内の「お問い合わせ」ページからご連絡ください。

---

## 📚 ドキュメント

詳細な技術仕様・要件定義は `non-public/` ディレクトリを参照してください：

- [ユーザー機能要件定義書](non-public/requirements_definition.md)
- [管理者機能要件定義書](non-public/admin_requirements.md)
- [技術仕様書](non-public/technical_specification.md)
- [セキュリティレビュー](non-public/SECURITY_REVIEW.md)
- [SEO対策実装ログ](non-public/SEO_ENHANCEMENT.md)

---

## 🎉 主要な実装履歴

### 2026年2月

- **管理者ログ管理機能**: ユーザーログの閲覧・削除・モデレーション機能を実装
- **画像メタデータ機能**: EXIF撮影時刻の抽出とギャラリー画像選択機能を追加
- **Firebase Auth対応**: Firebase Authentication への完全移行
- **統計情報改善**: 月別統計のソート機能追加
- **管理者システム**: 完全な管理者認証・権限管理システムの実装

### 2026年1月

- **即時Cloudinaryアップロード**: Base64/localStorageキャッシュを廃止し、直接アップロードに変更
- **クライアント側画像圧縮**: メモリ不足対策として1024x1024, 80%品質で圧縮
- **カスタムドメイン**: `michikusa-memory.com` への移行
- **SEO対策**: メタデータ最適化、構造化データ（JSON-LD）、robots.txt設定
- **PWA改善**: カメラ機能の最適化、ステータスバー・ナビゲーションバーの色設定

### 2025年12月

- **AIミッション生成**: Gemini API 1.5による位置情報・時間帯・明るさレベル対応
- **セキュリティ強化**: CSP、レート制限、入力サニタイズの実装
- **オフライン対応**: Service Worker、LocalStorageキャッシュ、バックグラウンド同期

---

**みちくさメモリー** - 今日の散歩に、小さな意味を。
