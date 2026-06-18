# 卓球特化プラットフォーム Web版 Phase 1

卓球プレイヤー向けに、練習記録・試合記録・用具・プロフィール・統計を管理できるWebアプリです。今回はWeb版 Phase 1のみを実装しており、モバイルアプリ、通知、SNS、チャット、マッチング、大会情報は含みません。

## 技術スタック

- Next.js App Router + TypeScript
- Tailwind CSS
- Next.js Route Handlers
- Prisma + PostgreSQL
- Auth.js / NextAuth v5
- Zod
- bcryptjs
- Recharts
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
```

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

```bash
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:migrate` は `packages/db` workspaceの `prisma migrate dev --schema prisma/schema.prisma` を実行します。

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
npm run typecheck -w @table-tennis/web
npm run lint
npm run build
```
