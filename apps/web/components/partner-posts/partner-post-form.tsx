import Link from "next/link";
import type { PartnerPostStatus, PartnerPostType } from "@table-tennis/db";
import { Button, ErrorMessage, Field, buttonStyles, inputClass } from "@/components/ui";
import { createPartnerPostAction, updatePartnerPostAction } from "@/lib/partner-post-actions";
import { partnerPostStatusLabels, partnerPostTypeLabels } from "@/lib/partner-posts";

type PartnerPostFormValue = {
  id: string;
  type: PartnerPostType;
  title: string;
  area: string | null;
  preferredTime: string | null;
  level: string | null;
  purpose: string | null;
  message: string | null;
  status: PartnerPostStatus;
};

export function PartnerPostForm({
  error,
  post
}: {
  error?: string;
  post?: PartnerPostFormValue;
}) {
  const isEditing = Boolean(post);

  return (
    <form action={isEditing ? updatePartnerPostAction : createPartnerPostAction} className="space-y-6">
      <ErrorMessage message={error} />
      {post ? <input name="id" type="hidden" value={post.id} /> : null}
      {isEditing ? <input name="type" type="hidden" value={post?.type ?? "PRACTICE"} /> : null}

      {!isEditing ? (
        <Field hint="練習相手か試合相手を選んでください。" label="募集種別">
          <select className={inputClass} defaultValue={post?.type ?? "PRACTICE"} name="type" required>
            <option value="PRACTICE">{partnerPostTypeLabels.PRACTICE}</option>
            <option value="MATCH">{partnerPostTypeLabels.MATCH}</option>
          </select>
        </Field>
      ) : null}

      <Field label="タイトル">
        <input
          className={inputClass}
          defaultValue={post?.title ?? ""}
          maxLength={60}
          name="title"
          placeholder="例：サーブ練習に付き合ってくれる人募集"
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field hint="具体的すぎる住所は書かないでください。" label="エリア">
          <input className={inputClass} defaultValue={post?.area ?? ""} maxLength={100} name="area" placeholder="例：東京都" />
        </Field>
        <Field label="希望日時">
          <input className={inputClass} defaultValue={post?.preferredTime ?? ""} maxLength={100} name="preferredTime" placeholder="例：土曜午後" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="レベル">
          <input className={inputClass} defaultValue={post?.level ?? ""} maxLength={50} name="level" placeholder="例：初級〜中級" />
        </Field>
        <Field label="目的">
          <input className={inputClass} defaultValue={post?.purpose ?? ""} maxLength={120} name="purpose" placeholder="例：サーブ・レシーブ練習" />
        </Field>
      </div>

      <Field hint="安全のため、住所・電話番号・メールアドレスなどの個人情報は書かないでください。" label="募集メッセージ">
        <textarea
          className={`${inputClass} min-h-40 resize-y`}
          defaultValue={post?.message ?? ""}
          maxLength={500}
          name="message"
          placeholder="例：1〜2時間ほど軽く練習したいです。"
          rows={6}
        />
      </Field>

      {isEditing ? (
        <Field label="ステータス">
          <select className={inputClass} defaultValue={post?.status ?? "OPEN"} name="status" required>
            <option value="OPEN">{partnerPostStatusLabels.OPEN}</option>
            <option value="CLOSED">{partnerPostStatusLabels.CLOSED}</option>
          </select>
        </Field>
      ) : null}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
        安全のため、住所・電話番号・メールアドレスなどの個人情報は書かないでください。
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <Button className="sm:min-w-32" type="submit">
          {isEditing ? "更新する" : "募集を作成する"}
        </Button>
        <Link className={buttonStyles({ variant: "secondary" })} href={post ? `/partner-posts/${post.id}` : "/partner-posts"}>
          戻る
        </Link>
      </div>
    </form>
  );
}
