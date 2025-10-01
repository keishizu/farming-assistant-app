# 環境変数設定手順

このドキュメントでは、Farming Assistant Appの環境変数設定手順について説明します。

## 必要な環境変数

### Supabase認証（必須）

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase Dashboard > Settings > API |

### オプション

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `SENTRY_DSN` | Sentryエラー監視DSN | Sentry Dashboard > Projects > Settings > Client Keys |

## 設定手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名とデータベースパスワードを設定
4. リージョンを選択（推奨: Asia Pacific (Tokyo)）

### 2. 環境変数の取得

1. Supabase Dashboardにログイン
2. 作成したプロジェクトを選択
3. 左サイドバーから「Settings」→「API」を選択
4. 以下の値をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. 環境変数ファイルの作成

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を記述：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# オプション: エラー監視
SENTRY_DSN=your-sentry-dsn
```

### 4. 認証設定の有効化

Supabase Dashboardで以下の設定を行います：

1. **Authentication** → **Settings** を選択
2. **Site URL** を設定：
   - 開発環境: `http://localhost:3000`
   - 本番環境: `https://your-domain.com`
3. **Redirect URLs** を設定：
   - 開発環境: `http://localhost:3000/auth/callback`
   - 本番環境: `https://your-domain.com/auth/callback`

### 5. 認証プロバイダーの設定

#### メール/パスワード認証

1. **Authentication** → **Providers** を選択
2. **Email** プロバイダーを有効化
3. **Confirm email** の設定（必要に応じて）

#### Google OAuth認証（オプション）

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. **APIs & Services** → **Credentials** を選択
3. **OAuth 2.0 Client IDs** を作成
4. **Authorized redirect URIs** に以下を追加：
   - `https://your-project-id.supabase.co/auth/v1/callback`
5. **Client ID** と **Client Secret** を取得
6. Supabase Dashboard → **Authentication** → **Providers** → **Google** を有効化
7. 取得した **Client ID** と **Client Secret** を設定

## 開発環境での動作確認

1. 環境変数を設定後、開発サーバーを起動：
   ```bash
   pnpm dev
   ```

2. ブラウザで `http://localhost:3000` にアクセス

3. 認証機能をテスト：
   - 新規登録
   - ログイン
   - ログアウト
   - Googleログイン（設定済みの場合）

## 本番環境での設定

### Vercelでの設定

1. Vercel Dashboardにログイン
2. プロジェクトを選択
3. **Settings** → **Environment Variables** を選択
4. 以下の環境変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SENTRY_DSN`（オプション）

### 本番環境のSupabase設定

1. **Site URL** を本番ドメインに変更
2. **Redirect URLs** を本番ドメインに変更
3. 必要に応じて **CORS** 設定を調整

## トラブルシューティング

### よくある問題

1. **認証が動作しない**
   - 環境変数が正しく設定されているか確認
   - Supabaseの認証設定が有効化されているか確認
   - ブラウザのコンソールでエラーメッセージを確認

2. **Googleログインが動作しない**
   - Google Cloud Consoleの設定を確認
   - リダイレクトURIが正しく設定されているか確認
   - SupabaseのGoogleプロバイダー設定を確認

3. **CORSエラーが発生する**
   - SupabaseのCORS設定を確認
   - 本番環境のドメインが正しく設定されているか確認

### ログの確認

開発環境では、ブラウザのコンソールで認証関連のログを確認できます：

```javascript
// 認証状態の確認
console.log('Auth state:', useAuth());
```

## セキュリティの注意事項

1. **環境変数の管理**
   - `.env.local` ファイルをGitにコミットしない
   - 本番環境の環境変数は適切に管理する

2. **Supabaseの設定**
   - RLS（Row Level Security）を有効化
   - 適切なポリシーを設定
   - 不要なAPIキーは無効化

3. **認証設定**
   - 強力なパスワードポリシーを設定
   - 必要に応じて二要素認証を有効化

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
