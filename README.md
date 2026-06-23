# 卓球特化プラットフォーム Web版 Phase 1

卓球プレイヤー向けに、練習記録・試合記録・用具・プロフィール・統計を管理できるWebアプリです。記録データから課題を分析し、次回の練習メニューを提案するGemini AIコーチも利用できます。モバイルアプリ、通知、SNS、チャット、マッチング、大会情報は含みません。

## 技術スタック

- Next.js App Router + TypeScript
- Tailwind CSS
- Next.js Route Handlers
- Prisma + PostgreSQL
- Auth.js / NextAuth v5
- Zod
- bcryptjs
- Recharts
- Google Gen AI SDK（サーバー側のみ）
- npm workspaces

## ディレクトリ構成

```txt
/
├── apps/
│   └── web/              # Next.js Webアプリ
├── packages/
│   └── db/               # Prisma schema・Prisma client共有
├── package.json          # npm workspaces
└── README.md
```

## セットアップ手順

```bash
npm install
cp apps/web/.env.local.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
```

monorepo構成では、Webアプリ用とPrisma CLI用の2つの環境変数ファイルが必要です。

```txt
apps/web/.env.local      # Next.js Webアプリ用
packages/db/.env         # Prisma CLI用
```

`apps/web/.env.local` を編集して、Webアプリが使うPostgreSQLとAuth.jsの値を設定してください。

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/table_tennis_dev?schema=public"
NEXTAUTH_SECRET="任意の十分に長いランダム文字列"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GEMINI_API_KEY="Google AI Studioで発行したAPIキー"
GEMINI_MODEL="gemini-2.5-flash"
```

### Gemini AIコーチの設定

[Google AI Studio](https://aistudio.google.com/app/apikey)でGemini APIキーを発行し、`apps/web/.env.local` の `GEMINI_API_KEY` に設定してください。`GEMINI_MODEL` は任意で、未設定時は `gemini-2.5-flash` を使用します。

AIコーチは `/ai-coach` で、ログインユーザー自身の直近の練習・試合と集約済みの分析データから、課題分析と練習メニュー案を生成します。提案メニューは既存の練習メニューとして保存できます。Gemini APIはRoute Handlerからのみ呼び出し、APIキーをクライアントコードや `NEXT_PUBLIC_` 環境変数へ設定しないでください。

`packages/db/.env` はPrisma CLI用です。`npm run prisma:generate` や `npm run prisma:migrate` は `packages/db` workspaceでPrisma CLIを実行するため、ここにも `DATABASE_URL` を設定してください。

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/table_tennis_dev?schema=public"
```

通常は `apps/web/.env.local` と `packages/db/.env` の `DATABASE_URL` を同じ値にします。

Googleログインを使う場合は、Google Cloud ConsoleでOAuthクライアントを作成し、承認済みリダイレクトURIに以下を追加します。

```txt
http://localhost:3000/api/auth/callback/google
```

## Prisma migration

Prisma schemaは `packages/db/prisma/schema.prisma` にあります。
Prisma CLIは `packages/db/.env` の `DATABASE_URL` を参照します。

開発環境では以下を実行します。

```bash
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:migrate` は `packages/db` workspaceの `prisma migrate dev --schema prisma/schema.prisma` を実行します。

本番環境では `prisma migrate dev` は使わず、必ず `prisma migrate deploy` を使って既存migrationを適用します。

```bash
npm run prisma:migrate:deploy
```

`npm run prisma:migrate:deploy` は `packages/db` workspaceの `prisma migrate deploy --schema prisma/schema.prisma` を実行します。

## seedデータ作成

開発確認用のテストユーザー、用具、練習記録、試合記録を作成できます。

```bash
npm run db:seed
```

作成されるログイン情報は以下です。

```txt
メールアドレス: portfolio@example.com
パスワード: password1234
```

seedは同じメールアドレスのユーザーをupsertし、そのユーザーに紐づく練習記録、試合記録、用具を作り直します。

## 開発サーバー起動

```bash
npm run dev
```

起動後、ブラウザで以下を開きます。

```txt
http://localhost:3000
```

## テスト用ユーザー作成

1. `/register` を開きます。
2. 名前、メールアドレス、8文字以上のパスワードを入力します。
3. 登録後、自動ログインして `/dashboard` に移動します。

メール認証はPhase 1では未実装です。

seedを使う場合は `/login` から `portfolio@example.com` / `password1234` でログインできます。

## 手動テスト手順

1. `npm run prisma:generate` と `npm run prisma:migrate` を実行します。
2. `npm run db:seed` を実行します。
3. `npm run dev` で開発サーバーを起動します。
4. `/login` からseedユーザーでログインします。
5. `/dashboard` で統計カード、月別グラフ、最近の練習・試合が表示されることを確認します。
6. `/equipment` で用具の追加、編集、削除、削除確認ダイアログを確認します。
7. `/practice` で練習記録の作成、詳細表示、編集、削除を確認します。
8. `/match` で試合記録の作成、セット追加、入力上限、編集、削除を確認します。
9. `/profile` でプロフィール更新とバリデーションエラー表示を確認します。
10. `GEMINI_API_KEY` を設定して `/ai-coach` で課題分析、メニュー提案、保存後の詳細画面遷移を確認します。
11. `GEMINI_API_KEY` を一時的に外し、AIコーチに設定不足のエラーが表示されることを確認します。
12. ログアウト後に `/dashboard` へ直接アクセスし、ログイン画面へ戻されることを確認します。

## 実装済み機能

- メールアドレス + パスワードの新規登録
- メールアドレス + パスワードのログイン
- Googleログイン
- ログアウト
- `/dashboard` 以降の認証必須化
- プロフィール取得・更新
- 用具の作成・一覧・詳細・更新・削除
- 練習記録の作成・一覧・詳細・更新・削除
- 試合記録の作成・一覧・詳細・更新・削除
- 統計API
- ダッシュボードの統計カード
- 最近の練習記録・試合記録
- 過去6ヶ月の月別練習時間グラフ
- 過去6ヶ月の月別勝率グラフ
- APIレスポンスの `{ data: ... }` / `{ error: string }` 統一
- Zodによるリクエストボディ検証
- `bcryptjs` saltRounds 12 によるパスワードハッシュ化
- 全ユーザーデータ操作で `userId` 条件を含めたアクセス制御
- Geminiによる課題分析と練習メニュー提案・保存
- AI出力のJSON parse・Zod検証とユーザー単位の簡易レート制限
- 開発確認用seed
- 統計ロジックと入力バリデーションのテスト
- ローディング・エラー・空状態・削除確認を含む基本UI状態

## デプロイ前チェックリスト

- `.env`、`.env.local`、`apps/web/.env.local`、`packages/db/.env` がGit管理されていないこと
- `node_modules`、`.next`、`*.tsbuildinfo` がGit管理されていないこと
- 本番DBの `DATABASE_URL` を設定していること
- `NEXTAUTH_SECRET` を十分に長いランダム文字列にしていること
- `NEXTAUTH_URL` がデプロイ先URLになっていること
- Googleログインを使う場合、OAuthのリダイレクトURIを本番URLに追加していること
- `npm run prisma:generate`、`npm run typecheck`、`npm run test`、`npm run lint`、`npm run build` が通ること
- 本番DBには `npm run prisma:migrate:deploy` でmigrationを適用すること

## Vercel + Supabase デプロイ手順

### 1. Supabaseで本番DBを作成

1. Supabaseでプロジェクトを作成します。
2. Project Settings > Database からPostgreSQL接続文字列を取得します。
3. Vercelから接続する場合は、Supabaseの接続プーラー用URIを `DATABASE_URL` に設定することを推奨します。
4. ローカルから本番DBへmigrationを適用する場合は、`packages/db/.env` の `DATABASE_URL` を本番DBの接続文字列に一時的に変更してから以下を実行します。

```bash
npm run prisma:migrate:deploy
```

本番DBに対して `npm run prisma:migrate`、つまり `prisma migrate dev` は実行しないでください。本番では既存migrationを適用する `prisma migrate deploy` のみを使います。

### 2. Vercelプロジェクトを作成

1. VercelでこのリポジトリをImportします。
2. Framework Presetは `Next.js` を選択します。
3. monorepo構成のため、Root Directoryはリポジトリルートのままにします。
4. Install Commandは通常どおり `npm install` を使います。
5. Build Commandは `npm run vercel-build` を設定します。
6. Output DirectoryはNext.jsのデフォルトのままにします。

`npm run vercel-build` は `npm run prisma:generate` のあとにWebアプリの `npm run build` を実行します。Vercel上ではmigrationを自動実行せず、デプロイ前に `npm run prisma:migrate:deploy` で本番DBへ適用してください。

### 3. Vercelに設定する環境変数

VercelのProject Settings > Environment Variables に以下を設定します。

```txt
DATABASE_URL          Supabase PostgreSQLの接続文字列
NEXTAUTH_SECRET       十分に長いランダム文字列
NEXTAUTH_URL          Vercelの本番URL。例: https://your-app.vercel.app
GOOGLE_CLIENT_ID      Googleログインを使う場合のみ設定
GOOGLE_CLIENT_SECRET  Googleログインを使う場合のみ設定
GEMINI_API_KEY        AIコーチで使うGemini APIキー
GEMINI_MODEL          任意。未設定時はgemini-2.5-flash
```

`GEMINI_API_KEY` はProduction / PreviewなどAIコーチを使う各環境にサーバー環境変数として設定してください。`NEXT_PUBLIC_GEMINI_API_KEY` のようなクライアント公開変数にはしないでください。

Googleログインを使う場合は、Google Cloud ConsoleのOAuthクライアントで承認済みリダイレクトURIに以下を追加します。

```txt
https://your-app.vercel.app/api/auth/callback/google
```

### 4. デプロイ後確認

1. Supabaseの本番DBに `npm run prisma:migrate:deploy` を適用済みであることを確認します。
2. VercelでProduction Deploymentを実行します。
3. `/register` でユーザー登録できることを確認します。
4. `/login`、`/dashboard`、`/equipment`、`/practice`、`/match`、`/ai-coach`、`/profile` の基本操作を確認します。

## よくあるエラーと対処法

- `Environment variable not found: DATABASE_URL`
  - `apps/web/.env.local` と `packages/db/.env` の両方に `DATABASE_URL` を設定してください。
- `NEXTAUTH_SECRET` がない、または認証でエラーになる
  - `apps/web/.env.local` に `NEXTAUTH_SECRET` を設定し、開発サーバーを再起動してください。
- `Prisma Client did not initialize yet`
  - `npm run prisma:generate` を実行してください。
- `relation ... does not exist`
  - `npm run prisma:migrate` を実行し、DBにmigrationを適用してください。
- seedがDBに反映されない
  - `packages/db/.env` の `DATABASE_URL` が、Webアプリで使っているDBと同じか確認してください。
- Googleログイン後に戻れない
  - Google Cloud Consoleの承認済みリダイレクトURIに `/api/auth/callback/google` を含むURLを追加してください。

- AIコーチにGemini APIキー未設定のエラーが表示される
  - `apps/web/.env.local` またはVercelのEnvironment Variablesに `GEMINI_API_KEY` を設定し、アプリを再起動・再デプロイしてください。

## 今後の拡張予定

- モバイルアプリ用の `apps/mobile` 追加
- Push通知
- 大会情報
- 対戦相手マッチング
- SNS・チャット
- 練習メニューのテンプレート化
- 詳細な分析指標の追加

## 検証コマンド

```bash
npm run prisma:generate
npm run test
npm run typecheck
npm run lint
npm run build
```
