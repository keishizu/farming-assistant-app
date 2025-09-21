# Farming Assistant App

農業支援アプリケーション。農作業の記録、管理、分析をサポートするWebアプリケーションです。

## 技術スタック

### フロントエンド
- **Next.js** (v14.2.25) - React フレームワーク
- **React** (v18.2.0) - UI ライブラリ
- **TypeScript** (v5.2.2) - 型付き JavaScript
- **shadcn/ui** - UI コンポーネント
- **Tailwind CSS** (v3.4.1) - ユーティリティファースト CSS フレームワーク
- **Radix UI** - アクセシブルなヘッドレス UI コンポーネント
- **Lucide React** (v0.446.0) - アイコンライブラリ

### バックエンド
- **Supabase** (Postgres, Storage) - バックエンドサービス
  - PostgreSQL - リレーショナルデータベース
  - Supabase Storage - ファイルストレージ
- ~~Prisma + SQLite~~ (移行前の構成)

### 認証
- **Supabase Auth** - 認証・ユーザー管理
  - メール/パスワード認証
  - Google OAuth認証
  - セッション管理と自動リフレッシュ
  - ページアクセス制御（認証が必要なページの保護）
  - 認証状態に応じたUI表示制御

### その他
- **date-fns** (v3.6.0) - 日付操作ライブラリ
- **Zod** - スキーマバリデーション

## Quick Start

```bash
git clone https://github.com/<your-org>/farming-assistant-app.git
cd farming-assistant-app
pnpm i
cp .env.example .env.local
pnpm dev
```

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | ✅ |
| `NEXT_PUBLIC_USE_SUPABASE_AUTH` | Supabase認証の有効化フラグ | ✅ |
| `SENTRY_DSN` | Sentryエラー監視DSN | ❌ |

`.env.example` を参照してください。

## Supabase セットアップ

詳細なセットアップ手順は [docs/supabase-setup.md](docs/supabase-setup.md) を参照してください。

### 必要な設定

- **user-uploads** バケットの作成
- Row Level Security (RLS) ポリシーの設定
  - ユーザーは自分のアップロードしたファイルのみアクセス可能
  - 認証済みユーザーのみアップロード可能

## プロジェクト構造

```
src/
├── app/                    # ルーティングとページコンポーネント
│   ├── (marketing)/       # ランディングページ、プライシング、お問い合わせなど
│   ├── (dashboard)/       # ログイン後のメイン機能
│   └── api/               # APIルート
│
├── components/            # Reactコンポーネント
│   ├── common/           # 共通コンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── layouts/          # レイアウトコンポーネント
│
├── hooks/                # カスタムフック
│
├── lib/                  # ユーティリティ関数
│   ├── constants/        # 定数
│   ├── types/           # 型定義
│   └── utils/           # ヘルパー関数
```

## 開発環境のセットアップ

1. リポジトリのクローン
2. 依存関係のインストール
3. 環境変数ファイルの作成（`.env.example` を参照）
4. 開発サーバーの起動

```bash
pnpm dev
```

## 主な機能

- **ユーザー認証（Supabase Auth）**
  - メール/パスワード認証
  - Google OAuth認証
  - セッション管理と自動リフレッシュ
  - 認証が必要なページの自動リダイレクト
  - 認証状態に応じたナビゲーション表示制御
- **農作業記録の管理**
- **作物の成長記録**
- **天気情報の表示**
- **作業スケジュール管理**
- **画像アップロード（Supabase Storage）**

## 開発ルール

- コンポーネントは原則としてServer Componentsを使用
- クライアントサイドの機能が必要な場合のみ`use client`ディレクティブを使用
- 型安全性を重視した開発
- アクセシビリティ対応
- レスポンシブデザインの実装

## ブランチ構成 (dev / main / production)

```
production
├── main
│   └── feature/feature-name
└── dev
```

### Vercel 環境変数のプロモート手順

1. **dev環境** → **main環境**
   - Vercel Dashboard で `dev` ブランチの環境変数を確認
   - `main` ブランチに同じ環境変数を設定

2. **main環境** → **production環境**
   - main環境での動作確認後
   - `production` 環境に本番用環境変数を設定

### 推奨プラットフォーム

Vercelプラットフォームを使用したデプロイメントを推奨します。

## ライセンス

[MIT License](LICENSE) 