# Supabase セットアップ
Supabase セットアップ手順
このアプリケーションで Supabase を利用するための設定手順を以下にまとめます。

1. プロジェクトの作成
https://supabase.com/ にアクセスし、Supabase プロジェクトを作成します。

2. 環境変数の取得と設定
Supabase ダッシュボードから以下を取得：
Project URL → .env.local の NEXT_PUBLIC_SUPABASE_URL に設定

Anon public API key → .env.local の NEXT_PUBLIC_SUPABASE_ANON_KEY に設定

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

3. RLS（Row Level Security）の有効化
対象テーブル（例：custom_crops, farm_records など）に対して RLS を ON にします。

4. RLSポリシーの作成（例）
各テーブルに対して、以下のようなポリシーを設定します。
-- SELECT
CREATE POLICY "Allow SELECT for own rows" ON custom_crops
FOR SELECT USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Allow INSERT for own rows" ON custom_crops
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Allow UPDATE for own rows" ON custom_crops
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Allow DELETE for own rows" ON custom_crops
FOR DELETE USING (auth.uid() = user_id);
※他のテーブル（farm_records など）でも同様のポリシーを設定します。

5. Supabase Storage の設定
バケット作成：
バケット名：user-uploads

公開設定：非公開（Public OFF）

RLSポリシー設定（Storage対象）：
対象：storage.objects
-- SELECT
CREATE POLICY "Allow SELECT for own files" ON storage.objects
FOR SELECT USING (auth.uid() = owner);

-- INSERT
CREATE POLICY "Allow INSERT for own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid() = owner);

-- UPDATE
CREATE POLICY "Allow UPDATE for own files" ON storage.objects
FOR UPDATE USING (auth.uid() = owner) WITH CHECK (auth.uid() = owner);

-- DELETE
CREATE POLICY "Allow DELETE for own files" ON storage.objects
FOR DELETE USING (auth.uid() = owner);
グローバルな SELECT 権限は削除
storage.objects に設定されている すべてのユーザーが SELECT できるポリシー は削除してください。

6. ClerkとのJWT連携設定（必要な場合）
[ClerkのDashboard > JWT Templates] にて aud: "supabase" を追加

Supabase 側の [Project Settings > Auth > JWT] にて、JWT Secret を Clerk と一致させる

補足
上記手順は Clerk 認証前提 の設定です

認証なしでの利用を想定する場合は RLS の内容を調整してください
