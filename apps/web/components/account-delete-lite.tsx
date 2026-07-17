"use client";

import { FormEvent, useMemo, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { Button, ErrorMessage, Field, inputClass } from "@/components/ui";
import { ACCOUNT_DELETION_CONFIRMATION_TEXT } from "@/lib/account-deletion";

type AccountDeleteLiteProps = {
  authMethod: "password" | "google" | "unsupported";
  isGoogleReauthenticated: boolean;
};

const deletionNotes = [
  "この操作は原則として取り消せません。",
  "プロフィール、練習、試合、用具などが削除されます。",
  "募集、参加希望、チャット、通知も削除されます。",
  "公開プロフィールも閲覧できなくなります。",
  "削除後は同じアカウントへログインできません。",
  "同じメールアドレスで将来再登録できる可能性がありますが、以前のデータは復元されません。",
  "インフラのバックアップやログには一定期間残る可能性があります。",
  "Googleアカウントそのものは削除されません。",
  "Table Tennis Logとの連携情報だけが削除対象です。"
] as const;

export function AccountDeleteLite({ authMethod, isGoogleReauthenticated }: AccountDeleteLiteProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmedIrreversible, setConfirmedIrreversible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const requiresPassword = authMethod === "password";
  const requiresGoogleReauth = authMethod === "google" && !isGoogleReauthenticated;
  const canSubmit = useMemo(
    () =>
      confirmationText === ACCOUNT_DELETION_CONFIRMATION_TEXT &&
      confirmedIrreversible &&
      !isSubmitting &&
      authMethod !== "unsupported" &&
      !requiresGoogleReauth &&
      (!requiresPassword || currentPassword.length > 0),
    [
      authMethod,
      confirmationText,
      confirmedIrreversible,
      currentPassword.length,
      isSubmitting,
      requiresGoogleReauth,
      requiresPassword
    ]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(requiresPassword ? { currentPassword } : {}),
          confirmationText,
          confirmedIrreversible
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };

      if (!response.ok || payload.success !== true) {
        setError(payload.error ?? "アカウントを削除できませんでした。時間をおいて再度お試しください。");
        return;
      }

      await signOut({ redirectTo: "/account-deleted" });
    } catch {
      setError("アカウントを削除できませんでした。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
        <h2 className="text-lg font-bold text-red-950">削除される内容</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-red-950/85">
          {deletionNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      {authMethod === "unsupported" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          このアカウントでは安全な本人確認方法を確認できません。時間をおいて再度ログインしてください。
        </div>
      ) : null}

      {requiresGoogleReauth ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
          <p className="font-bold">Googleログインユーザーは削除前にGoogleで再認証してください。</p>
          <p className="mt-1">再認証から10分以内だけ削除できます。</p>
          <Button
            className="mt-4"
            disabled={isGoogleSubmitting}
            onClick={() => {
              setIsGoogleSubmitting(true);
              void signIn("google", { callbackUrl: "/account/delete" });
            }}
            type="button"
            variant="secondary"
          >
            {isGoogleSubmitting ? "Googleへ移動中..." : "Googleで再認証"}
          </Button>
        </div>
      ) : null}

      {requiresPassword ? (
        <Field label="現在のパスワード">
          <input
            autoComplete="current-password"
            className={inputClass}
            name="currentPassword"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </Field>
      ) : null}

      <Field hint={`「${ACCOUNT_DELETION_CONFIRMATION_TEXT}」と完全一致で入力してください。`} label="確認文言">
        <input
          className={inputClass}
          name="confirmationText"
          onChange={(event) => setConfirmationText(event.target.value)}
          required
          value={confirmationText}
        />
      </Field>

      <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3">
        <input
          checked={confirmedIrreversible}
          className="mt-1 size-4 accent-red-600"
          name="confirmedIrreversible"
          onChange={(event) => setConfirmedIrreversible(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm font-semibold leading-6 text-slate-900">
          この操作が原則として復元できないことを理解しました。
        </span>
      </label>

      <Button className="w-full sm:w-auto" disabled={!canSubmit} type="submit" variant="danger">
        {isSubmitting ? "削除中..." : "アカウントを完全に削除"}
      </Button>
    </form>
  );
}
