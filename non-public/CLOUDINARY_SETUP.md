# Cloudinary 統合ガイド（Phase 3）

## 📋 概要

Reborn では、画像管理に **Cloudinary** を使用します。  
Cloudinary は画像CDNとして、自動最適化・リサイズ・変換機能を提供します。

**SDK情報**:

- **公式SDK**: `cloudinary` (v2) - Node.js環境専用
- **クライアント**: Fetch API + Unsigned Upload Preset
- **サーバー**: Cloudinary SDK v2（将来実装）

---

## 🔧 セットアップ手順

### 1. パッケージインストール

```bash
npm install cloudinary
```

**注意**: Cloudinary SDK v2 はサーバーサイド専用です。  
クライアントサイドでは引き続き Fetch API を使用します。

---

### 2. Cloudinary アカウント作成

1. [Cloudinary](https://cloudinary.com/) にアクセス
2. 無料アカウントを作成（月25クレジット = 25,000変換）
3. ダッシュボードから以下の情報を取得：
   - **Cloud Name**: `dpm2sszur`（例）
   - **API Key**: `865138954921996`（例）
   - **API Secret**: `<your_api_secret>`（サーバーサイドのみ）

---

### 3. Upload Preset 作成

1. Cloudinary ダッシュボード → **Settings** → **Upload**
2. **Upload presets** セクションで **Add upload preset** をクリック
3. 設定：
   - **Preset name**: `sanposhin_preset`（任意）
   - **Signing Mode**: `Unsigned`（重要: クライアントからアップロード可能）
   - **Folder**: `sanposhin`（自動フォルダ分け）
   - **Unique filename**: `true`
   - **Overwrite**: `false`
4. **Save** をクリック

---

### 4. 環境変数設定

`.env.local` に以下を追加：

```env
# Cloudinary (Phase 3)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dpm2sszur
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=sanposhin_preset
NEXT_PUBLIC_CLOUDINARY_API_KEY=865138954921996
CLOUDINARY_API_SECRET=<your_api_secret>  # サーバーサイドのみ（公開禁止）
```

⚠️ **重要**:

- `NEXT_PUBLIC_*` 変数はクライアントに公開されます
- `CLOUDINARY_API_SECRET` は公開しないこと（サーバーサイドのみ使用）

---

## 🚀 使用方法

### クライアントサイド（現在実装済み）

#### 画像アップロード（record/page.tsx）

```typescript
import { uploadImageFile, isCloudinaryConfigured } from '@/lib/cloudinary';

// Cloudinary が設定されているかチェック
if (isCloudinaryConfigured()) {
  // File オブジェクトをアップロード（Fetch API使用）
  const cloudinaryUrl = await uploadImageFile(imageFile, userId);
  
  // Firestore に URL を保存
  const log = {
    ...otherFields,
    imageUrl: cloudinaryUrl,
    imageData: undefined, // Base64 は保存しない
  };
}
```

---

### サーバーサイド（将来実装）

#### 公式SDK使用例（lib/cloudinary-server.ts）

```typescript
import { v2 as cloudinary } from 'cloudinary';

// 設定（サーバーサイドのみ）
cloudinary.config({ 
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // サーバーサイドのみ
});

// 画像アップロード
const uploadResult = await cloudinary.uploader.upload(imageData, {
  folder: `sanposhin/${userId}`,
  public_id: 'adventure_photo',
});

// 最適化URL生成
const optimizeUrl = cloudinary.url('adventure_photo', {
  fetch_format: 'auto',
  quality: 'auto'
});

// 自動クロップ（正方形）
const autoCropUrl = cloudinary.url('adventure_photo', {
  crop: 'auto',
  gravity: 'auto',
  width: 500,
  height: 500,
});

// 画像削除
const deleteResult = await cloudinary.uploader.destroy(publicId);
```

#### API Route 実装例（将来実装）

```typescript
// app/api/cloudinary/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadImageServer } from '@/lib/cloudinary-server';

export async function POST(request: NextRequest) {
  const { imageData, userId } = await request.json();
  
  try {
    const result = await uploadImageServer(imageData, userId);
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

---

## 📊 データフロー

### クライアントサイド（現在）

```
[ユーザー] → [写真撮影] → [File Object]
                ↓
      [Fetch API + Unsigned Preset]
                ↓
         [Cloudinary Upload]
                ↓
         [URL 取得] (https://res.cloudinary.com/...)
                ↓
         [Firestore に URL 保存]
                ↓
         [アルバムで URL 参照 + 変換]
```

### サーバーサイド（将来）

```
[ユーザー] → [写真撮影] → [File Object]
                ↓
         [Next.js API Route]
                ↓
      [Cloudinary SDK v2 + API Secret]
                ↓
         [Cloudinary Upload]
                ↓
         [URL 取得 + 削除権限]
                ↓
         [Firestore に URL 保存]
```

---

## 🎨 画像変換機能

### 自動最適化

- **フォーマット**: WebP（対応ブラウザ）、JPEG（その他）
- **品質**: 自動調整（`q_auto`）
- **サイズ**: デバイスに応じて最適化

### リサイズオプション

| サイズ | 用途 | 変換パラメータ |
|------|------|--------------|
| サムネイル | 一覧表示 | `w_150,h_150,c_thumb,q_auto,f_auto` |
| 中サイズ | 詳細表示 | `w_800,h_600,c_fit,q_auto,f_auto` |
| 大サイズ | フル表示 | `w_1920,h_1080,c_fit,q_80,f_auto` |

### 変換例

**元のURL**:

```
https://res.cloudinary.com/demo/image/upload/sample.jpg
```

**サムネイルURL（クライアント変換）**:

```
https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_thumb,q_auto,f_auto/sample.jpg
```

**SDK変換（サーバーサイド）**:

```typescript
const url = cloudinary.url('sample', {
  width: 150,
  height: 150,
  crop: 'thumb',
  quality: 'auto',
  fetch_format: 'auto'
});
```

---

## 🔒 セキュリティ

### クライアントサイド

- ✅ `Cloud Name`, `Upload Preset`, `API Key` のみ公開
- ✅ Unsigned Upload Preset 使用
- ✅ ファイルサイズ制限（5MB）
- ✅ ファイルタイプ検証（image/*）

### サーバーサイド（将来実装）

- ❌ `API Secret` は公開しない
- ❌ 画像削除は Backend API 経由のみ
- ❌ Signed Upload は Backend のみ

---

## 💰 料金プラン

### 無料プラン

- **変換**: 25,000回/月
- **ストレージ**: 25GB
- **帯域幅**: 25GB/月
- **ユーザー数**: 1名

### 使用量目安

- 1ログあたり3変換（サムネイル + 中 + 大）
- 月間約8,000ログまで対応可能

---

## 🐛 トラブルシューティング

### エラー: "Cloudinary is not configured"

**原因**: 環境変数が設定されていない

**解決策**:

```bash
# .env.local を確認
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx
```

---

### エラー: "Upload preset not found"

**原因**: Upload Preset が存在しない or Signed モード

**解決策**:

1. Cloudinary ダッシュボードで Upload Preset を確認
2. **Signing Mode** を `Unsigned` に変更

---

### 画像が表示されない

**原因**: Cloudinary URL が正しくない

**デバッグ**:

```typescript
console.log('Image URL:', log.imageUrl);
console.log('Thumbnail URL:', getThumbnailUrl(log.imageUrl));
```

---

## 📖 参考リンク

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [JavaScript SDK](https://cloudinary.com/documentation/javascript_integration)

---

## ✅ チェックリスト

Phase 3 実装完了確認：

- [ ] Cloudinary アカウント作成完了
- [ ] Upload Preset 作成完了（Unsigned モード）
- [ ] `.env.local` に環境変数追加完了
- [ ] `lib/cloudinary.ts` 動作確認
- [ ] record/page.tsx で画像アップロード成功
- [ ] album/page.tsx で画像表示成功
- [ ] サムネイル・中・大サイズの変換確認
- [ ] オフライン時の Base64 フォールバック確認

---

**Phase 3 実装日**: 2026年2月2日  
**次のステップ**: AI ミッション生成（ChatGPT API）
