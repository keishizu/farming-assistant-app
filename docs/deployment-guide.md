# デプロイメント手順

このドキュメントでは、Farming Assistant Appのデプロイメント手順について説明します。

## 前提条件

- Supabaseプロジェクトが作成済み
- Vercelアカウントが作成済み
- GitHubリポジトリが作成済み

## 1. Supabaseの設定

### 1.1 認証設定

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. **Authentication** → **Settings** を選択
4. 以下の設定を行う：

#### Site URL設定
- 開発環境: `http://localhost:3000`
- 本番環境: `https://your-domain.vercel.app`

#### Redirect URLs設定
- 開発環境: `http://localhost:3000/auth/callback`
- 本番環境: `https://your-domain.vercel.app/auth/callback`

### 1.2 認証プロバイダーの設定

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

### 1.3 データベース設定

1. **Database** → **Tables** を選択
2. 必要なテーブルを作成
3. **RLS（Row Level Security）** を有効化
4. 適切なポリシーを設定

### 1.4 ストレージ設定

1. **Storage** → **Buckets** を選択
2. **user-uploads** バケットを作成
3. **Public** を **OFF** に設定
4. RLSポリシーを設定

## 2. Vercelでのデプロイメント

### 2.1 プロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. **New Project** をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を設定
5. **Deploy** をクリック

### 2.2 環境変数の設定

Vercel Dashboardで以下の環境変数を設定：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Supabase匿名キー |
| `SENTRY_DSN` | `your-sentry-dsn` | Sentryエラー監視DSN（オプション） |

### 2.3 環境別の設定

#### 開発環境（devブランチ）
- 環境変数を開発用に設定
- SupabaseのSite URLを `http://localhost:3000` に設定

#### 本番環境（mainブランチ）
- 環境変数を本番用に設定
- SupabaseのSite URLを本番ドメインに設定

## 3. デプロイメントの実行

### 3.1 初回デプロイメント

1. コードをGitHubにプッシュ
2. Vercelが自動的にビルドとデプロイを実行
3. デプロイメント完了後、URLを確認

### 3.2 継続的デプロイメント

- `main` ブランチへのプッシュで本番環境にデプロイ
- `dev` ブランチへのプッシュで開発環境にデプロイ
- プルリクエストでプレビューデプロイメント

## 4. 動作確認

### 4.1 認証機能の確認

1. デプロイされたURLにアクセス
2. 新規登録機能をテスト
3. ログイン機能をテスト
4. ログアウト機能をテスト
5. Googleログイン機能をテスト（設定済みの場合）

### 4.2 主要機能の確認

1. 農作業記録の作成・編集・削除
2. 作物の成長記録の管理
3. 画像アップロード機能
4. 作業スケジュール管理

### 4.3 エラーログの確認

1. Vercel Dashboard → **Functions** → **Logs** でエラーログを確認
2. Supabase Dashboard → **Logs** でデータベースログを確認
3. Sentry Dashboardでエラー監視（設定済みの場合）

## 5. パフォーマンス最適化

### 5.1 Next.jsの最適化

1. **Image Optimization** の活用
2. **Static Generation** の活用
3. **Code Splitting** の確認

### 5.2 Supabaseの最適化

1. **Database Indexing** の設定
2. **Connection Pooling** の設定
3. **Caching** の活用

## 6. セキュリティ設定

### 6.1 環境変数の管理

1. 機密情報は環境変数で管理
2. 本番環境の環境変数は適切に保護
3. 不要な環境変数は削除

### 6.2 Supabaseのセキュリティ

1. **RLS（Row Level Security）** の有効化
2. 適切なポリシーの設定
3. **API Keys** の適切な管理

### 6.3 Vercelのセキュリティ

1. **Security Headers** の設定
2. **CORS** の適切な設定
3. **Rate Limiting** の設定

## 7. 監視とメンテナンス

### 7.1 エラー監視

1. **Sentry** の設定（オプション）
2. **Vercel Analytics** の活用
3. **Supabase Logs** の定期確認

### 7.2 パフォーマンス監視

1. **Core Web Vitals** の監視
2. **Vercel Speed Insights** の活用
3. **Supabase Performance** の監視

### 7.3 定期メンテナンス

1. 依存関係の更新
2. セキュリティパッチの適用
3. データベースの最適化

## 8. トラブルシューティング

### 8.1 よくある問題

1. **認証エラー**
   - 環境変数の確認
   - Supabaseの設定確認
   - CORS設定の確認

2. **ビルドエラー**
   - 依存関係の確認
   - TypeScriptエラーの確認
   - 環境変数の確認

3. **デプロイエラー**
   - Vercelのログ確認
   - 環境変数の確認
   - ビルド設定の確認

### 8.2 ログの確認方法

1. **Vercel Dashboard** → **Functions** → **Logs**
2. **Supabase Dashboard** → **Logs**
3. **Sentry Dashboard**（設定済みの場合）

## 9. ロールバック手順

### 9.1 緊急時のロールバック

1. Vercel Dashboardで前のバージョンにロールバック
2. 問題の特定と修正
3. 修正版のデプロイ

### 9.2 データベースのロールバック

1. Supabase Dashboardでデータベースのバックアップを確認
2. 必要に応じてデータベースを復元
3. アプリケーションの修正

## 10. 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Sentry Documentation](https://docs.sentry.io/)
