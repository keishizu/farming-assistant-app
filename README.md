# Farming Assistant App

農業支援アプリケーション。農作業の記録、管理、分析をサポートするWebアプリケーションです。

## 技術スタック

### フロントエンド
- **Next.js** (v14.2.25) - React フレームワーク
- **React** (v18.2.0) - UI ライブラリ
- **TypeScript** (v5.2.2) - 型付き JavaScript
- **Shadcn/ui** - UI コンポーネント
- **Tailwind CSS** (v3.4.1) - ユーティリティファースト CSS フレームワーク
- **Radix UI** - アクセシブルなヘッドレス UI コンポーネント
- **Lucide React** (v0.446.0) - アイコンライブラリ

### バックエンド
- **Prisma** (v5.11.0) - TypeSafe ORM
- Local SQLite（後に Supabase へ移行予定）

### 認証
- **Clerk** (v6.12.9) - 認証・ユーザー管理

### その他
- **date-fns** (v3.6.0) - 日付操作ライブラリ
- **Zod** - スキーマバリデーション

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
│
└── dal/                 # Data Access Layer
```

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone [repository-url]
cd farming-assistant-app
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
`.env`ファイルを作成し、以下の環境変数を設定：
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

4. データベースのセットアップ
```bash
npx prisma generate
npx prisma db push
```

5. 開発サーバーの起動
```bash
npm run dev
```

## 主な機能

- ユーザー認証（Clerk）
- 農作業記録の管理
- 作物の成長記録
- 天気情報の表示
- 作業スケジュール管理

## 開発ルール

- コンポーネントは原則としてServer Componentsを使用
- クライアントサイドの機能が必要な場合のみ`use client`ディレクティブを使用
- 型安全性を重視した開発
- アクセシビリティ対応
- レスポンシブデザインの実装

## デプロイメント

Vercelプラットフォームを使用したデプロイメントを推奨します。

## ライセンス

[MIT License](LICENSE) 