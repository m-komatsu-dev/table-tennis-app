# このアプリのコード説明

このアプリは、卓球プレイヤーが「練習記録」「試合記録」「用具」「プロフィール」「統計」を管理するための Web アプリです。

技術的には、Next.js の App Router で画面と API を作り、Prisma で PostgreSQL にアクセスし、NextAuth/Auth.js でログイン状態を管理しています。

## 1. アプリ全体の構成

大きく見ると、次の2つに分かれています。

```txt
/
├── apps/web/        # ユーザーがブラウザで見る Next.js アプリ
└── packages/db/     # Prisma schema と Prisma Client の共有パッケージ
```

ルートの `package.json` は npm workspaces の親です。

- `npm run dev` は `apps/web` の Next.js 開発サーバーを起動します。
- `npm run build` は Web アプリをビルドします。
- `npm run prisma:generate` や `npm run prisma:migrate` は `packages/db` 側の Prisma コマンドを実行します。

画面表示の流れはおおむね次の通りです。

```txt
ブラウザ
  ↓
Next.js の page.tsx
  ↓
必要なら Prisma で DB から取得
  ↓
React コンポーネントで表示
```

フォーム送信の流れは次の通りです。

```txt
ブラウザのフォーム
  ↓ fetch()
API Route
  ↓ 入力チェック
Prisma
  ↓
PostgreSQL
```

## 2. 主要ディレクトリの意味

### `apps/web`

Next.js の Web アプリ本体です。

### `apps/web/app`

Next.js App Router のページと API が入っています。

- `page.tsx` はトップページです。
- `layout.tsx` は全体共通の HTML レイアウトです。
- `(auth)` はログイン・新規登録など、認証用ページのグループです。
- `(protected)` はログイン後だけ見られるページのグループです。
- `api` は API Route です。

丸括弧のディレクトリ、たとえば `(auth)` や `(protected)` は URL には出ません。

例:

```txt
apps/web/app/(auth)/login/page.tsx
```

これは実際の URL では `/login` になります。

### `apps/web/components`

画面の部品が入っています。

- `practice-form.tsx`: 練習記録フォーム
- `match-form.tsx`: 試合記録フォーム
- `equipment-manager.tsx`: 用具の追加・編集・削除 UI
- `profile-form.tsx`: プロフィール編集フォーム
- `dashboard-charts.tsx`: グラフ表示
- `ui.tsx`: Card、Field、Badge などの共通 UI 部品

### `apps/web/lib`

共通処理が入っています。

- `api.ts`: API レスポンス、認証チェック、入力エラー処理など
- `server-auth.ts`: ページ側でログイン必須にする処理
- `validators.ts`: Zod による入力チェック
- `serialize.ts`: Date などを画面で扱いやすい形に変換
- `format.ts`: 日付やパーセント表示などの整形

### `apps/web/types`

画面や API で使う TypeScript の型が入っています。

### `packages/db`

DB 関連の共有パッケージです。

- `prisma/schema.prisma`: DB の設計図
- `prisma/migrations`: DB 変更履歴
- `src/index.ts`: Prisma Client を作って外部に公開する場所

## 3. `prisma/schema.prisma` の意味

`packages/db/prisma/schema.prisma` は、アプリが使うデータベースの設計図です。

ここには「どんなテーブルがあるか」「各テーブルにどんな列があるか」「テーブル同士がどうつながるか」が書かれています。

### `generator client`

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Prisma Client という、TypeScript から DB を操作するためのコードを生成する設定です。

### `datasource db`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

PostgreSQL を使い、接続先は環境変数 `DATABASE_URL` から読むという意味です。

### enum

enum は「決められた選択肢」です。

- `Level`: ユーザーのレベル
  - `BEGINNER`
  - `INTERMEDIATE`
  - `ADVANCED`
  - `COMPETITIVE`
- `MatchType`: 試合種別
  - `PRACTICE`
  - `OFFICIAL`
  - `TOURNAMENT`
- `MatchResult`: 勝敗
  - `WIN`
  - `LOSE`
  - `DRAW`

### `User`

ユーザー情報です。

主な項目:

- `id`: ユーザーID
- `email`: メールアドレス。一意です。
- `name`: 名前
- `passwordHash`: パスワードをハッシュ化したもの
- `googleId`: Google ログイン用 ID
- `level`: 卓球レベル
- `playStyle`: プレースタイル
- `club`: 所属クラブ
- `avatarUrl`: アイコン画像 URL

また、ユーザーは複数の練習記録、試合記録、用具を持ちます。

```prisma
practiceLogs PracticeLog[]
matchRecords MatchRecord[]
equipment    Equipment[]
```

### `PracticeLog`

練習記録です。

主な項目:

- `userId`: どのユーザーの記録か
- `practicedAt`: 練習日
- `durationMin`: 練習時間、分単位
- `location`: 場所
- `content`: 練習内容メモ
- `equipmentId`: 使用した用具

`user` とつながっているので、誰の練習記録か分かります。

### `MatchRecord`

試合記録です。

主な項目:

- `userId`: どのユーザーの記録か
- `opponentName`: 対戦相手名
- `matchType`: 練習試合、公式戦、大会など
- `scores`: セットごとのスコア。JSON で保存します。
- `result`: 勝ち、負け、引き分け
- `memo`: メモ
- `playedAt`: 試合日

### `Equipment`

用具情報です。

主な項目:

- `userId`: どのユーザーの用具か
- `blade`: ラケット名
- `rubberFh`: フォア側ラバー
- `rubberBh`: バック側ラバー
- `isCurrent`: 現在使用中か

練習記録は用具と紐づけられます。

## 4. 各ページの役割

### `/`

ファイル:

```txt
apps/web/app/page.tsx
```

トップページです。アプリの説明と、新規登録・ログインへのリンクがあります。

### `/login`

ファイル:

```txt
apps/web/app/(auth)/login/page.tsx
```

ログインページです。

メールアドレス・パスワードログインと Google ログインに対応しています。

### `/register`

ファイル:

```txt
apps/web/app/(auth)/register/page.tsx
```

新規登録ページです。

`/api/auth/register` にリクエストしてユーザーを作り、その後 credentials ログインで自動ログインします。

### `/dashboard`

ファイル:

```txt
apps/web/app/(protected)/dashboard/page.tsx
```

ログイン後のダッシュボードです。

表示内容:

- 総練習回数
- 総練習時間
- 総試合数
- 勝敗数
- 勝率
- 最近の練習記録
- 最近の試合記録
- 過去6ヶ月のグラフ

### `/practice`

ファイル:

```txt
apps/web/app/(protected)/practice/page.tsx
```

練習記録の一覧ページです。

### `/practice/new`

ファイル:

```txt
apps/web/app/(protected)/practice/new/page.tsx
```

練習記録の新規作成ページです。

`PracticeForm` コンポーネントを使っています。

### `/practice/[id]`

ファイル:

```txt
apps/web/app/(protected)/practice/[id]/page.tsx
```

練習記録の詳細・編集ページです。

`[id]` は記録 ID を表します。

例:

```txt
/practice/abc-123
```

### `/match`

ファイル:

```txt
apps/web/app/(protected)/match/page.tsx
```

試合記録の一覧ページです。

### `/match/new`

ファイル:

```txt
apps/web/app/(protected)/match/new/page.tsx
```

試合記録の新規作成ページです。

### `/match/[id]`

ファイル:

```txt
apps/web/app/(protected)/match/[id]/page.tsx
```

試合記録の詳細・編集ページです。

### `/equipment`

ファイル:

```txt
apps/web/app/(protected)/equipment/page.tsx
```

用具管理ページです。

ラケット名、フォアラバー、バックラバー、現在使用中かどうかを管理します。

### `/profile`

ファイル:

```txt
apps/web/app/(protected)/profile/page.tsx
```

プロフィール編集ページです。

名前、所属クラブ、レベル、プレースタイル、アイコン URL を編集できます。

## 5. API Route の役割

API Route は、画面から `fetch()` で呼ばれるサーバー側の処理です。

このアプリでは、API の返し方が基本的に統一されています。

成功:

```json
{ "data": "..." }
```

失敗:

```json
{ "error": "エラーメッセージ" }
```

共通処理はここにあります。

```txt
apps/web/lib/api.ts
```

### `/api/auth/register`

ファイル:

```txt
apps/web/app/api/auth/register/route.ts
```

新規ユーザー登録をします。

流れ:

1. 入力を `registerSchema` でチェック
2. メールアドレスの重複確認
3. パスワードを bcrypt でハッシュ化
4. `User` を作成

### `/api/profile`

ファイル:

```txt
apps/web/app/api/profile/route.ts
```

プロフィール取得・更新です。

- `GET`: 自分のプロフィールを取得
- `PATCH`: 自分のプロフィールを更新

### `/api/equipment`

ファイル:

```txt
apps/web/app/api/equipment/route.ts
```

用具一覧取得・作成です。

- `GET`: 自分の用具一覧
- `POST`: 用具作成

### `/api/equipment/[id]`

ファイル:

```txt
apps/web/app/api/equipment/[id]/route.ts
```

特定の用具の取得・更新・削除です。

- `GET`
- `PATCH`
- `DELETE`

すべて `id` と `userId` の両方を条件にしているので、他人の用具を操作しにくい作りです。

### `/api/practice`

ファイル:

```txt
apps/web/app/api/practice/route.ts
```

練習記録一覧取得・作成です。

- `GET`: 自分の練習記録一覧
- `POST`: 練習記録作成

用具 ID が指定された場合、その用具が自分のものか確認しています。

### `/api/practice/[id]`

ファイル:

```txt
apps/web/app/api/practice/[id]/route.ts
```

特定の練習記録の取得・更新・削除です。

- `GET`
- `PATCH`
- `DELETE`

### `/api/match`

ファイル:

```txt
apps/web/app/api/match/route.ts
```

試合記録一覧取得・作成です。

- `GET`: 自分の試合記録一覧
- `POST`: 試合記録作成

### `/api/match/[id]`

ファイル:

```txt
apps/web/app/api/match/[id]/route.ts
```

特定の試合記録の取得・更新・削除です。

- `GET`
- `PATCH`
- `DELETE`

### `/api/stats/summary`

ファイル:

```txt
apps/web/app/api/stats/summary/route.ts
```

統計の概要を返します。

内容:

- 練習回数
- 練習時間
- 試合数
- 勝敗数
- 勝率
- 最近の練習記録
- 最近の試合記録

### `/api/stats/monthly`

ファイル:

```txt
apps/web/app/api/stats/monthly/route.ts
```

過去6ヶ月の月別統計を返します。

内容:

- 月別練習時間
- 月別試合数
- 月別勝利数
- 月別勝率

## 6. 認証の流れ

認証の中心はこのファイルです。

```txt
apps/web/auth.ts
```

使っている認証方法は2つです。

1. メールアドレス + パスワード
2. Google ログイン

### メールアドレス + パスワード登録

1. ユーザーが `/register` で名前、メールアドレス、パスワードを入力
2. `/api/auth/register` が呼ばれる
3. Zod で入力チェック
4. bcrypt でパスワードをハッシュ化
5. `User` テーブルに保存
6. 登録後、`signIn("credentials")` で自動ログイン
7. `/dashboard` へ移動

### メールアドレス + パスワードログイン

1. ユーザーが `/login` でメールアドレスとパスワードを入力
2. `signIn("credentials")` が呼ばれる
3. `auth.ts` の `Credentials` provider が動く
4. DB からメールアドレスでユーザーを探す
5. bcrypt でパスワードが正しいか確認
6. 正しければログイン成功
7. JWT セッションにユーザー ID が入る

### Google ログイン

1. ユーザーが `/login` の Google ログインを押す
2. Google の認証画面へ移動
3. 認証成功後、アプリに戻る
4. `auth.ts` の `signIn` callback が動く
5. Google のメールアドレスを元に `User` を `upsert`
6. JWT callback で DB のユーザー ID を token に入れる
7. session callback で `session.user.id` として使えるようにする

### 保護ページへのアクセス制御

保護対象の URL は `middleware.ts` でチェックしています。

```txt
apps/web/middleware.ts
```

対象:

- `/dashboard`
- `/practice`
- `/match`
- `/equipment`
- `/profile`

ログインしていない場合は `/login` にリダイレクトされます。

さらに、`(protected)/layout.tsx` でも `auth()` を呼び、未ログインなら `/login` にリダイレクトします。

つまり、保護は二重にかかっています。

## 7. 次に機能追加するとき、触る可能性が高いファイル

### 新しい DB 項目やテーブルを追加する場合

まず触る可能性が高いです。

```txt
packages/db/prisma/schema.prisma
```

その後、Prisma migration と Prisma Client 生成が必要になります。

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 入力項目を増やす場合

例: 練習記録に「練習強度」を追加する場合。

触る可能性が高いファイル:

```txt
packages/db/prisma/schema.prisma
apps/web/lib/validators.ts
apps/web/types/app.ts
apps/web/lib/serialize.ts
apps/web/components/practice-form.tsx
apps/web/app/api/practice/route.ts
apps/web/app/api/practice/[id]/route.ts
apps/web/app/(protected)/practice/page.tsx
apps/web/app/(protected)/practice/[id]/page.tsx
```

### 新しいページを追加する場合

例: 練習メニュー一覧ページを追加する場合。

触る可能性が高いファイル:

```txt
apps/web/app/(protected)/training-menu/page.tsx
apps/web/app/(protected)/layout.tsx
```

`layout.tsx` はナビゲーションにリンクを追加するためです。

### 新しい API を追加する場合

例:

```txt
apps/web/app/api/training-menu/route.ts
apps/web/app/api/training-menu/[id]/route.ts
```

入力チェックが必要なら、ここも触ります。

```txt
apps/web/lib/validators.ts
```

### 新しいフォーム UI を追加する場合

触る可能性が高い場所:

```txt
apps/web/components/
```

共通 UI 部品を増やすなら:

```txt
apps/web/components/ui.tsx
```

### 統計やグラフを増やす場合

触る可能性が高いファイル:

```txt
apps/web/app/(protected)/dashboard/page.tsx
apps/web/components/dashboard-charts.tsx
apps/web/app/api/stats/summary/route.ts
apps/web/app/api/stats/monthly/route.ts
```

### 認証まわりを変える場合

触る可能性が高いファイル:

```txt
apps/web/auth.ts
apps/web/middleware.ts
apps/web/app/(auth)/login/page.tsx
apps/web/app/(auth)/register/page.tsx
apps/web/app/api/auth/register/route.ts
apps/web/types/next-auth.d.ts
```

## 初心者向けの読み方

最初はこの順番で読むと分かりやすいです。

1. `README.md`
2. `packages/db/prisma/schema.prisma`
3. `apps/web/app/page.tsx`
4. `apps/web/app/(protected)/layout.tsx`
5. `apps/web/app/(protected)/dashboard/page.tsx`
6. `apps/web/components/practice-form.tsx`
7. `apps/web/app/api/practice/route.ts`
8. `apps/web/auth.ts`

ポイントは、「ページ」「フォーム」「API」「DB」のつながりを見ることです。

例として練習記録なら、次の流れです。

```txt
/practice/new のページ
  ↓
PracticeForm
  ↓
fetch("/api/practice")
  ↓
API Route
  ↓
Prisma
  ↓
PracticeLog テーブル
```

この流れが分かると、試合記録や用具管理もかなり同じ構造で読めます。
