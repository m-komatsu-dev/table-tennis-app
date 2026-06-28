# 卓球記録アプリ

卓球の練習記録・試合記録・練習メニュー・分析・カレンダー表示を管理できるWeb/モバイル対応の記録アプリ。

卓球プレイヤーが自分の練習・試合を継続的に記録し、あとから振り返るためのアプリです。Web版はNext.js、モバイル版はExpo / React Nativeで実装し、どちらも同じPostgreSQLデータベースをWeb API経由で利用します。

## 技術スタック

- Monorepo / npm workspaces
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL / Supabase
- Auth.js / NextAuth v5
- Zod
- bcryptjs
- Recharts
- Google Gen AI SDK
- Expo / React Native / Expo Router
- Expo SecureStore
- Vercel
- Vitest
- GitHub Actions

## ディレクトリ構成

```txt
table-tennis-app/
├── apps/
│   ├── web/              # Next.js Webアプリ・Web API
│   └── mobile/           # Expo / React Native モバイルアプリ
├── packages/
│   └── db/               # Prisma schema / DB client / seed
├── .github/
│   └── workflows/        # CI
├── README.md
└── package.json
```

rootのnpm workspaceには `apps/web` と `packages/*` が含まれます。`apps/mobile` はExpo SDK 54用の独立したnpm projectとして扱います。

## 実装済み機能

### Web版

- 公開トップページ
- ユーザー登録、メールアドレス + パスワードログイン、Googleログイン、ログアウト
- 認証必須エリアの保護
- ダッシュボード
  - 統計カード
  - 最近の練習記録・試合記録
  - 月別練習時間グラフ
  - 月別勝率グラフ
- 練習記録の一覧・作成・詳細・編集・削除
- 試合記録の一覧・作成・詳細・編集・削除
- 練習メニューの一覧・作成・詳細・編集・削除
- 用具の作成・一覧・詳細・編集・削除
- プロフィール表示・更新
- 分析画面
- 練習記録・試合記録のカレンダー表示
- Gemini AIコーチ
  - 直近の練習・試合・分析データを使った課題分析
  - 練習メニュー案の生成
  - 生成した練習メニューの保存
- Zodによる入力検証
- ユーザー単位のデータ分離
- Vitestによる分析ロジック、バリデーション、認証・API周辺のテスト

### モバイル版

- 公開ホーム画面
- 新規登録、ログイン、ログアウト
- Expo SecureStoreによるアクセストークン保存
- プロフィール表示・編集
- 練習記録の一覧・作成・詳細・編集・削除
- 試合記録の一覧・作成・詳細・編集・削除
- 練習メニューの一覧・作成・詳細・編集・削除
- 練習記録作成時の練習メニュー選択
- モバイル簡易分析
  - 練習回数、練習時間、試合数、勝敗、勝率
  - 最近の練習・試合
  - よく対戦する相手
- モバイル版AIコーチ
  - 練習記録・試合記録をもとに、良かった点・課題・次の練習案を提案
  - AI APIキーはサーバー側で管理
- 練習記録・試合記録のカレンダー表示
- モバイル版アプリ内通知
  - 練習記録・試合記録・練習メニューの状態に応じて通知カードを表示
  - 練習リマインダー、週次まとめ、AIコーチ案内を表示
  - Push通知ではなく、まずはExpo Goで確認できるアプリ内通知として実装

### SNS風共有機能

- 練習記録・試合記録・分析結果を共有用カードとして表示
- Xなどに投稿しやすい文章をコピー可能
- 公開プロフィールページを用意
- 公開プロフィールはデフォルトOFFで、プライバシーに配慮

### マッチングLite

- 練習相手・試合相手の募集を作成可能
- 募集一覧・詳細を表示
- 他ユーザーの募集に参加希望を送信可能
- チャットなしで、まずは安全な募集・参加希望の土台を実装

### Web版マッチングLite

- 練習相手・試合相手の募集一覧を表示
- 募集作成・詳細・編集・削除に対応
- 参加希望の送信・確認・承認・見送りに対応

## セットアップ

### 依存関係インストール

ルートでWeb版と共有パッケージの依存関係をインストールします。

```bash
npm install
```

モバイル版は `apps/mobile` で別途インストールします。

```bash
cd apps/mobile
npm install
```

## 環境変数

秘密情報の実値はGitに含めないでください。`.env`、`.env.local`、`packages/db/.env`、`apps/mobile/.env` などはローカルまたはデプロイ先の環境変数として管理します。

### Web版

`apps/web/.env.local` に設定します。Prisma CLI用に `packages/db/.env` にも `DATABASE_URL` を設定します。

```env
DATABASE_URL=
AUTH_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_MOBILE_CLIENT_IDS=
GEMINI_API_KEY=
GEMINI_MODEL=
MOBILE_AUTH_SECRET=
```

- `DATABASE_URL`: PostgreSQL / Supabaseの接続文字列
- `AUTH_SECRET` または `NEXTAUTH_SECRET`: Auth.js / NextAuthの署名用シークレット
- `NEXTAUTH_URL`: ローカルまたは本番のWeb URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Web版のGoogleログインを使う場合に設定
- `GOOGLE_MOBILE_CLIENT_IDS`: モバイル版Googleログインで許可するClient ID。複数ある場合はカンマ区切り。未設定時は `GOOGLE_CLIENT_ID` などの公開Client IDも検証対象に使います
- `GEMINI_API_KEY`: AIコーチを使う場合に設定
- `GEMINI_MODEL`: 任意。未設定時はコード上のデフォルトモデルを使用
- `MOBILE_AUTH_SECRET`: モバイルAPIのBearer Token署名用。32文字以上の値をサーバー側だけに設定

`MOBILE_AUTH_SECRET` は未設定時に `AUTH_SECRET` / `NEXTAUTH_SECRET` へフォールバックしますが、運用では専用の値を設定することを推奨します。

### Googleログイン設定

Web版のGoogleログインでは、Google Cloud ConsoleでWebアプリ用OAuth Clientを作成し、発行された値をサーバー側の環境変数に設定します。実値はREADMEやGitに書かないでください。

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

承認済みリダイレクトURIには、利用するWebアプリURLに合わせて以下を設定します。

```txt
http://localhost:3000/api/auth/callback/google
https://table-tennis-app-rho.vercel.app/api/auth/callback/google
```

本番URLが変わる場合は、そのURLの `/api/auth/callback/google` を登録してください。`GOOGLE_CLIENT_SECRET` はWebサーバー側だけに設定し、モバイルアプリや `NEXT_PUBLIC_` / `EXPO_PUBLIC_` 変数には入れないでください。

モバイル版のGoogleログインでは、アプリ側がGoogleから受け取った `id_token` を `POST /api/mobile/auth/google` に送り、Web API側でGoogle署名、`aud`、`iss`、`exp`、`email`、`email_verified`、`sub`、nonceがある場合はnonceを検証します。サーバー側には検証を許可するClient IDを設定します。

```env
GOOGLE_MOBILE_CLIENT_IDS=
```

`GOOGLE_MOBILE_CLIENT_IDS` は秘密情報ではありませんが、サーバー側の検証ポリシーとして扱います。複数のClient IDを使う場合はカンマ区切りにしてください。既存Web版のClient IDだけで検証する構成なら、`GOOGLE_CLIENT_ID` がフォールバックとして使われます。

Expo Goではモバイル版Googleログインの確認は行いません。Expo GoでGoogleログインボタンを押してもOAuthは開始せず、メールアドレス・パスワードログインを案内します。GoogleログインはEAS Development Buildで確認してください。

今回のアプリ scheme は `tabletennis` です。EAS Development Buildや将来のストア配布では、Androidパッケージ名/SHA-1に紐づくAndroid OAuth Client ID、iOS Bundle IDに紐づくiOS OAuth Client IDをGoogle Cloud Consoleで作成し、下記のモバイル公開環境変数に設定します。AuthSessionのredirect URIはビルド形態によって変わるため、開発ビルドで実際のURIを確認してGoogle Cloud Consoleへ登録してください。

### Prisma CLI

`packages/db/.env` に設定します。

```env
DATABASE_URL=
```

通常は `apps/web/.env.local` と `packages/db/.env` の `DATABASE_URL` を同じDBに向けます。

### モバイル版

`apps/mobile/.env` などで、公開してよい `EXPO_PUBLIC_` 系の値だけを設定します。

```env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=
```

`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` はExpo GoやWeb向け、`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` は将来のAndroid/iOSビルド向けに使います。構成上不要なものは空のままで構いません。`MOBILE_AUTH_SECRET`、`GOOGLE_CLIENT_SECRET`、`DATABASE_URL` はモバイルアプリ側には入れないでください。モバイル側に置くのは公開される前提の `EXPO_PUBLIC_` 系の値のみです。

## ローカル起動

### Web版

```bash
npm run dev
```

またはworkspaceを明示します。

```bash
npm run dev -w @table-tennis/web
```

起動後、以下を開きます。

```txt
http://localhost:3000
```

### モバイル版

先にWeb APIを起動し、`apps/mobile` 側で `EXPO_PUBLIC_API_URL` をWeb APIのURLに向けてからExpoを起動します。

```bash
cd apps/mobile
npx expo start -c
```

## Prisma / DB

Prisma schemaは `packages/db/prisma/schema.prisma` にあります。

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
```

- `npm run prisma:generate`: Prisma Client生成
- `npm run prisma:migrate`: 開発DB向けの `prisma migrate dev`
- `npm run prisma:studio`: Prisma Studio起動
- `npm run db:seed`: 開発確認用seedの投入

本番DBに対して `prisma migrate dev` は実行しないでください。本番DBへ既存migrationを適用する場合は、接続先を十分確認したうえで以下を使います。

```bash
npm run prisma:migrate:deploy
```

## テスト・検査コマンド

Web版と共有パッケージはルートから実行します。

```bash
npm run test
npm run prisma:generate
npm run typecheck -w @table-tennis/web
npm run lint
npm run build
```

モバイル版は `apps/mobile` で確認します。

```bash
cd apps/mobile
npm install
npm run typecheck
npx expo-doctor
npx expo start -c
```

CIではNode.js 22を使い、`npm ci --include=optional`、Vitest、Prisma Client生成、typecheck、lint、buildを実行します。

## デプロイ構成

- Web版はVercelにデプロイします。
- DBはSupabase PostgreSQLを想定しています。
- モバイル版は `EXPO_PUBLIC_API_URL` でWeb APIのURLに接続します。
- Vercel上ではmigrationを自動実行せず、必要なmigrationはデプロイ前に `npm run prisma:migrate:deploy` で適用します。

rootの `package.json` には以下のビルド用scriptがあります。

```bash
npm run vercel-build
```

内容はPrisma Client生成後にWeb版をビルドします。

```bash
npm run prisma:generate && npm run build -w @table-tennis/web
```

`apps/web/vercel.json` では、Web appをRoot Directoryにした場合の設定として以下が置かれています。

```bash
cd ../.. && npm ci --include=optional
cd ../.. && npm run prisma:generate && npm run build -w @table-tennis/web
```

Vercelに設定する主な環境変数名は以下です。実値はREADMEやGitに書かないでください。

```txt
DATABASE_URL
AUTH_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_MOBILE_CLIENT_IDS
GEMINI_API_KEY
GEMINI_MODEL
MOBILE_AUTH_SECRET
```

## モバイルAPI概要

モバイル版はDBへ直接接続せず、Web版のRoute Handlerを呼び出します。認証が必要なAPIでは `Authorization: Bearer <accessToken>` を送ります。

実装済みの主なエンドポイントは以下です。

```txt
POST   /api/mobile/auth/login
POST   /api/mobile/auth/register
POST   /api/mobile/auth/google
GET    /api/mobile/me
GET    /api/mobile/profile
PUT    /api/mobile/profile
GET    /api/mobile/practice
POST   /api/mobile/practice
GET    /api/mobile/practice/[id]
PUT    /api/mobile/practice/[id]
DELETE /api/mobile/practice/[id]
GET    /api/mobile/match
POST   /api/mobile/match
GET    /api/mobile/match/[id]
PUT    /api/mobile/match/[id]
DELETE /api/mobile/match/[id]
GET    /api/mobile/practice-menus
POST   /api/mobile/practice-menus
GET    /api/mobile/practice-menus/[id]
PUT    /api/mobile/practice-menus/[id]
DELETE /api/mobile/practice-menus/[id]
GET    /api/mobile/partner-posts
POST   /api/mobile/partner-posts
GET    /api/mobile/partner-posts/[id]
PUT    /api/mobile/partner-posts/[id]
DELETE /api/mobile/partner-posts/[id]
POST   /api/mobile/partner-posts/[id]/requests
GET    /api/mobile/partner-posts/[id]/requests
PUT    /api/mobile/partner-requests/[id]
```

## 注意事項

- `.env`、`.env.local`、`packages/db/.env`、`apps/mobile/.env` などの秘密情報はGitに含めないでください。
- `DATABASE_URL`、`AUTH_SECRET`、`NEXTAUTH_SECRET`、`MOBILE_AUTH_SECRET`、`GEMINI_API_KEY` などはクライアント側へ露出させないでください。
- `MOBILE_AUTH_SECRET`、`GOOGLE_CLIENT_SECRET`、`DATABASE_URL` は絶対にモバイルアプリ側へ入れないでください。
- Expoの `EXPO_PUBLIC_` 変数は公開される前提で扱ってください。
- Gemini APIキーはサーバー側の環境変数として設定し、`NEXT_PUBLIC_` や `EXPO_PUBLIC_` には設定しないでください。
- 本番DBに対するmigrationは、接続先と実行コマンドを確認してから行ってください。

## 今後の予定

以下は実装済み機能ではなく、今後の改善候補です。

- UI/UX改善
- モバイル版の安定化
- AIコーチ機能のモバイル対応
- Push通知
- EAS Build
- ストア配布
- より詳細な分析
