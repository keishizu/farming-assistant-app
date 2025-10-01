# Farming Assistant App

農業支援アプリケーション。農作業の記録、管理、分析をサポートするWebアプリケーションです。

## 技術スタック

### フロントエンド
- **Next.js** (v14.2.26) - React フレームワーク
- **React** (v18.2.0) - UI ライブラリ
- **TypeScript** (v5.2.2) - 型付き JavaScript
- **shadcn/ui** - UI コンポーネント
- **Tailwind CSS** (v3.3.3) - ユーティリティファースト CSS フレームワーク
- **Radix UI** - アクセシブルなヘッドレス UI コンポーネント
- **Lucide React** (v0.446.0) - アイコンライブラリ

### バックエンド
- **Supabase** (Postgres, Storage) - バックエンドサービス
  - PostgreSQL - リレーショナルデータベース
  - Supabase Storage - ファイルストレージ
  - Row Level Security (RLS) - データセキュリティ
- ~~Prisma + SQLite~~ (移行前の構成)

### 認証システム
- **Supabase Auth** - 認証・ユーザー管理（移行完了）
  - メール/パスワード認証
  - Google OAuth認証
  - セッション管理と自動リフレッシュ
  - ページアクセス制御（認証が必要なページの保護）
  - 認証状態に応じたUI表示制御
  - JWT トークンベースの認証

### テスト
- **Jest** (v30.0.2) - テストフレームワーク
- **@testing-library/react** (v16.3.0) - React コンポーネントテスト
- **@testing-library/jest-dom** (v6.8.0) - DOM テストユーティリティ

### その他
- **date-fns** (v3.6.0) - 日付操作ライブラリ
- **Zod** - スキーマバリデーション
- **Sentry** - エラー監視（オプション）

## Quick Start

```bash
git clone https://github.com/<your-org>/farming-assistant-app.git
cd farming-assistant-app
npm install
cp .env.example .env.local
# 環境変数を設定（詳細は下記参照）
npm run dev
```

## 環境変数

### 必須の環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase Dashboard > Settings > API |

### オプションの環境変数

現在なし

### 環境変数の設定例

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

詳細な設定手順は [docs/environment-setup.md](docs/environment-setup.md) を参照してください。

## セットアップ手順

### 1. Supabase セットアップ

詳細なセットアップ手順は [docs/supabase-setup.md](docs/supabase-setup.md) を参照してください。

#### 必要な設定

- **user-uploads** バケットの作成
- Row Level Security (RLS) ポリシーの設定
  - ユーザーは自分のアップロードしたファイルのみアクセス可能
  - 認証済みユーザーのみアップロード可能

### 2. 認証設定

- メール/パスワード認証の有効化
- Google OAuth認証の設定（オプション）
- Site URL と Redirect URLs の設定

### 3. データベース設定

- 必要なテーブルの作成
- RLS（Row Level Security）の有効化
- 適切なポリシーの設定

## プロジェクト構造

```
src/
├── app/                    # ルーティングとページコンポーネント
│   ├── (auth)/            # 認証保護された機能グループ
│   │   ├── calendar/
│   │   ├── crop-schedule/
│   │   ├── smart-schedule/
│   │   ├── todo/
│   │   └── work-record/
│   ├── auth/
│   │   ├── callback/route.ts
│   │   └── reset-password/page.tsx
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── api/
│   │   └── comments/route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── auth/
│   ├── screens/
│   └── ui/
│
├── hooks/
├── lib/
│   ├── auth-config.ts
│   ├── supabase.ts
│   └── utils.ts
├── services/
├── types/
└── middleware.ts
```

## 開発環境のセットアップ

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/<your-org>/farming-assistant-app.git
cd farming-assistant-app
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
# .env.local を編集してSupabaseの認証情報を設定
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. 動作確認

- ブラウザで `http://localhost:3000` にアクセス
- 認証機能をテスト（新規登録、ログイン、ログアウト）
- 主要機能の動作確認

## 主な機能

### 認証・ユーザー管理
- **Supabase Auth** による認証システム
  - メール/パスワード認証
  - Google OAuth認証
  - セッション管理と自動リフレッシュ
  - 認証が必要なページの自動リダイレクト
  - 認証状態に応じたナビゲーション表示制御
  - JWT トークンベースのセキュアな認証

### 農作業管理
- **農作業記録の管理**
  - 作業内容の記録・編集・削除
  - 作業日時の管理
  - 作業場所の記録
- **作物の成長記録**
  - 作物の成長段階の記録
  - 成長過程の写真管理
  - 収穫量の記録
- **作業スケジュール管理**
  - 今後の作業予定の管理
  - 作業の優先度設定

### データ管理
- **画像アップロード（Supabase Storage）**
  - セキュアなファイルストレージ
  - ユーザー別のファイル管理
  - 画像の最適化と圧縮
- **天気情報の表示（今後実装予定）**
  - 作業日の天気情報
  - 天気予報の表示

### セキュリティ
- **Row Level Security (RLS)**
  - ユーザーデータの完全分離
  - セキュアなデータアクセス制御
- **認証ベースのアクセス制御**
  - 認証が必要なページの保護
  - ユーザー固有データの保護

## 開発ルール

### Next.js ベストプラクティス
- コンポーネントは原則としてServer Componentsを使用
- クライアントサイドの機能が必要な場合のみ`use client`ディレクティブを使用
- データフェッチはServer Componentsで実行
- API ルートは POST/PATCH/PUT/DELETE のみ（例外: 開発用に `app/api/comments` で GET を暫定提供）

### コード品質
- 型安全性を重視した開発
- ESLint によるコード品質管理
- 適切なエラーハンドリングの実装

### UI/UX
- アクセシビリティ対応
- レスポンシブデザインの実装
- shadcn/ui コンポーネントの活用

### テスト
- Jest + Testing Library による単体テスト
- 認証フローの統合テスト
- エラーハンドリングのテスト

## デプロイメント

### ブランチ構成

```
production
├── main
│   └── feature/feature-name
└── dev
```

### Vercel デプロイメント

詳細なデプロイメント手順は [docs/deployment-guide.md](docs/deployment-guide.md) を参照してください。

#### 環境変数のプロモート手順

1. **dev環境** → **main環境**
   - Vercel Dashboard で `dev` ブランチの環境変数を確認
   - `main` ブランチに同じ環境変数を設定

2. **main環境** → **production環境**
   - main環境での動作確認後
   - `production` 環境に本番用環境変数を設定

#### 推奨プラットフォーム

Vercelプラットフォームを使用したデプロイメントを推奨します。

### 継続的デプロイメント

- `main` ブランチへのプッシュで本番環境にデプロイ
- `dev` ブランチへのプッシュで開発環境にデプロイ
- プルリクエストでプレビューデプロイメント

## ドキュメント

- [環境変数設定手順](docs/environment-setup.md)
- [Supabase セットアップ](docs/supabase-setup.md)
- [デプロイメント手順](docs/deployment-guide.md)
- [認証システム移行計画](docs/auth-migration-plan.md)

## ライセンス

[MIT License](LICENSE) 