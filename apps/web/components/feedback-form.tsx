"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeedbackCategory } from "@table-tennis/db";
import { Button, Card, ErrorMessage, Field, SuccessMessage, buttonStyles, inputClass } from "@/components/ui";
import { feedbackCategoryOptions } from "@/lib/feedback-options";

const initialCategory: FeedbackCategory = "BUG";

export function FeedbackForm() {
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSourcePath(window.location.pathname);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, body, sourcePath })
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "フィードバックを送信できませんでした。");
        return;
      }

      setCategory(initialCategory);
      setSubject("");
      setBody("");
      setSuccess("フィードバックを送信しました。ご協力ありがとうございます。");
    } catch {
      setError("フィードバックを送信できませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-7">
      <div className="mb-5 space-y-3">
        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="カテゴリ">
          <select className={inputClass} disabled={submitting} onChange={(event) => setCategory(event.target.value as FeedbackCategory)} value={category}>
            {feedbackCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="件名">
          <input
            className={inputClass}
            disabled={submitting}
            maxLength={100}
            minLength={2}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="例：練習記録の保存時にエラーが出る"
            required
            value={subject}
          />
        </Field>
        <Field
          hint="氏名、住所、電話番号などの個人情報は入力しないでください。"
          label="内容"
        >
          <textarea
            className={`${inputClass} min-h-48 resize-y`}
            disabled={submitting}
            maxLength={3000}
            minLength={10}
            onChange={(event) => setBody(event.target.value)}
            placeholder="起きたこと、期待した動き、使いにくかった点などを教えてください。"
            required
            value={body}
          />
        </Field>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          他のユーザー、募集、参加希望、チャットメッセージを報告する場合は、各画面の通報機能をご利用ください。
          緊急の安全上の問題や犯罪に関する相談は、本サービスではなく警察などの適切な機関へご相談ください。
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link className={buttonStyles({ variant: "secondary" })} href="/feedback/history">
            自分の送信履歴
          </Link>
          <Button disabled={submitting} type="submit">
            {submitting ? "送信中..." : "送信する"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
