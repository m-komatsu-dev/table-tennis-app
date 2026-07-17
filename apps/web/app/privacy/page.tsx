import type { Metadata } from "next";
import Link from "next/link";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${legalConfig.serviceName}`,
  description: `${legalConfig.serviceName}のβ版向けプライバシーポリシー`
};

const sections = [
  {
    title: "1. 基本方針",
    body: [
      `${legalConfig.serviceName}は、卓球の記録、分析、交流機能を提供するために取得した情報を、必要な範囲で適切に取り扱います。`,
      "このポリシーは、現在のβ版実装を前提とした初稿です。正式公開前に内容確認と必要な修正を行います。"
    ]
  },
  {
    title: "2. 取得する情報",
    body: [
      "アカウント情報：メールアドレス、表示名、ユーザー名、パスワードのハッシュ値、Googleログインに必要な識別情報、アイコン画像URLまたは画像データ、性別、卓球レベル、所属クラブ、プレースタイル、公開プロフィール設定。",
      "ユーザーが登録する情報：練習記録、試合記録、練習メニュー、用具情報、練習内容や課題メモ、募集内容、参加希望、チャットメッセージ、通報内容、ブロック情報、公開設定、アプリ内通知の表示状態、チャット未読・既読管理情報。",
      "自動的に取得される可能性がある情報：Auth.js等による認証セッション情報、Cookie、モバイル端末内のアクセストークン、アクセス日時、IPアドレス、ブラウザ情報、端末情報、エラーログ等。これらはアプリ本体またはホスティング、実行基盤、認証処理のために記録される場合があります。"
    ]
  },
  {
    title: "3. 利用目的",
    body: [
      "アカウント登録、ログイン、Googleログイン、認証状態の維持のため。",
      "卓球の練習記録、試合記録、用具、練習メニューを保存、表示、編集するため。",
      "分析、カレンダー、AIコーチ、練習メニュー提案を提供するため。",
      "公開プロフィール、共有機能、練習相手募集、参加希望、チャットを提供するため。",
      "通報、ブロック、管理者向け通報確認、不正利用や規約違反の調査、安全確保のため。",
      "障害対応、セキュリティ対応、サービス改善、問い合わせ対応、法令に基づく対応のため。"
    ]
  },
  {
    title: "4. 公開される情報",
    body: [
      "公開プロフィールを有効にした場合、ユーザー名、表示名、卓球レベル、プレースタイル、公開設定された練習記録、公開設定された試合記録が公開ページで表示される可能性があります。現在の公開プロフィールページでは、メールアドレスやパスワードハッシュは表示しません。",
      "練習相手募集では、他のログイン中ユーザーに募集タイトル、種別、エリア、希望日時、レベル、目的、募集メッセージ、募集者の表示名、公開プロフィールの有無等が表示されます。",
      "メールアドレス、パスワードハッシュ、認証トークン、ブロック情報、非公開チャット、管理用の通報確認情報は、公開ページには表示しない方針です。"
    ]
  },
  {
    title: "5. AI機能での情報利用",
    body: [
      "AIコーチでは、回答生成のため、練習・試合記録、試合結果、セットスコア、メモ、用具名、練習メニュー名、分析結果、記録件数などを必要な範囲でGoogle Geminiへ送信する可能性があります。",
      "実装上、AIへ送信する前に、メールアドレス、URL、電話番号を置換し、対戦相手名や所属名を別名または伏せ字に変換する処理を行っています。",
      "パスワード、パスワードハッシュ、認証トークン、Google Client Secret、Gemini APIキー、データベース接続情報はAIへ送信しません。メールアドレスなど回答生成に不要な情報をAIへ送信しない方針です。",
      "AI回答は自動生成であり、外部AIサービスの取扱いには、その提供者の規約やポリシーが適用される場合があります。"
    ]
  },
  {
    title: "6. 外部サービス",
    body: [
      "本サービスでは、実装および環境設定上、以下の外部サービスまたは外部提供の基盤を利用します。外部事業者の所在地、保存国、保存期間はここでは推測して記載しません。"
    ],
    table: [
      ["Vercel", "Webアプリのホスティング、実行、ログ", "アクセス情報、実行ログ、エラー情報等"],
      ["Supabase / PostgreSQL", "データベース保存", "アカウント情報、記録、募集、チャット、通報、ブロック等"],
      ["Google", "Googleログイン", "Googleアカウントの識別子、メールアドレス、表示名、アイコンURL等"],
      ["Google Gemini", "AI回答生成", "匿名化・制限処理を行った練習・試合記録、分析用コンテキスト等"],
      ["Expo", "モバイルアプリの開発・配信関連", "モバイルアプリの実行・配信に必要な情報等"]
    ]
  },
  {
    title: "7. 第三者提供・委託",
    body: [
      "法令に基づく場合、本人の同意がある場合、人の生命・身体・財産の保護が必要な場合等を除き、本人の同意なく個人データを第三者へ提供しない方針です。",
      "サービス提供に必要な範囲で、ホスティング、データベース、認証、AI回答生成、モバイル配信関連の外部事業者へ情報の取扱いを委託する場合があります。",
      "委託先については、サービス提供上必要な範囲で選定し、適切に管理するよう努めます。"
    ]
  },
  {
    title: "8. 安全管理",
    body: [
      "パスワードはハッシュ化して保存し、平文パスワードを保存しません。",
      "認証、ユーザー単位のデータ分離、管理画面の権限制御、秘密情報の環境変数管理、通信の暗号化、通報・ブロック、必要な範囲でのログ確認等により、安全管理に努めます。",
      "脆弱性、不正アクセス、障害が確認された場合には、必要な範囲で調査と対応を行います。ただし、完全な安全を保証するものではありません。"
    ]
  },
  {
    title: "9. Cookie・ローカルストレージ",
    body: [
      "Web版では、ログイン状態の維持、認証、セキュリティ、Googleログイン連携、新規登録時の同意確認のためにCookieを利用する場合があります。",
      "モバイル版では、ログイン状態の維持のため、Expo SecureStore等の端末内ストレージにアクセストークンを保存します。",
      "現在の実装では、広告配信や行動ターゲティングを目的としたマーケティングトラッキングは追加していません。"
    ]
  },
  {
    title: "10. 保存期間",
    body: [
      "登録情報、記録、募集、チャット、通報、ブロック等は、アカウントが存在する間、またはサービス提供、不正利用対策、障害対応、法令上必要な期間、保存される場合があります。",
      "具体的な保存日数は現在の実装では定めていません。バックアップやログは、削除依頼やアカウント削除後も直ちに削除されない場合があります。"
    ]
  },
  {
    title: "11. 利用者からの請求・問い合わせ",
    body: [
      "登録情報の確認、訂正、削除、利用停止、アカウント削除、その他個人情報に関する相談を受け付ける方針です。",
      legalConfig.contactMethod
        ? `問い合わせは、${legalConfig.contactMethod}からご連絡ください。`
        : "現在のβ版では、問い合わせ窓口は正式公開までに整備します。現時点では、存在しない問い合わせ先を表示しません。"
    ]
  },
  {
    title: "12. 未成年者",
    body: [
      "18歳未満のユーザーは、必要に応じて保護者など法定代理人の同意を得て、本サービスを利用してください。"
    ]
  },
  {
    title: "13. 改定",
    body: [
      "運営者は、必要に応じて本ポリシーを変更する場合があります。",
      "重要な変更を行う場合は、サービス内での表示その他適切な方法により通知します。",
      "本ページには、制定日または改定日、およびバージョンを表示します。"
    ]
  }
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <Link className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-900" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white">T</span>
          {legalConfig.serviceName}
        </Link>
        <header className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
          <p className="text-sm font-bold text-emerald-700">β版向け初稿</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">プライバシーポリシー</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            この文書は現在の実装内容に沿った初稿であり、正式な法的助言ではありません。正式公開前に専門家を含む人間による確認が必要です。
          </p>
        </header>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="border-b border-slate-200 pb-2 text-xl font-bold tracking-tight">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {"table" in section ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-bold">サービス</th>
                        <th className="px-4 py-3 font-bold">利用目的</th>
                        <th className="px-4 py-3 font-bold">送信・保存される可能性がある情報</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {section.table.map(([service, purpose, data]) => (
                        <tr key={service}>
                          <td className="px-4 py-3 font-semibold">{service}</td>
                          <td className="px-4 py-3">{purpose}</td>
                          <td className="px-4 py-3">{data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}
        </div>
        <footer className="mt-10 border-t border-slate-200 py-6 text-sm text-slate-600">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className="font-semibold text-emerald-700" href="/terms">
              利用規約
            </Link>
            <Link className="font-semibold text-emerald-700" href="/">
              トップへ戻る
            </Link>
          </div>
          <p className="mt-4">施行日：{legalConfig.effectiveDate} / バージョン：{legalConfig.privacyVersion}</p>
        </footer>
      </article>
    </main>
  );
}
