import Link from "next/link";
import { notFound } from "next/navigation";
import { createChatMessageAction, reportChatMessageAction } from "@/app/(protected)/chat/actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, ErrorMessage, Field, PageHeader, SuccessMessage, buttonStyles, inputClass } from "@/components/ui";
import { ChatError, getChatRoomForUser } from "@/lib/chat";
import { formatDateTime } from "@/lib/format";
import { reportReasonOptions } from "@/lib/safety";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

export default async function ChatDetailPage({ params, searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;
  const query = await searchParams;

  let chatRoom: Awaited<ReturnType<typeof getChatRoomForUser>>;

  try {
    chatRoom = await getChatRoomForUser(id, userId);
  } catch (error) {
    if (error instanceof ChatError && error.status === 404) {
      notFound();
    }

    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader action={<Link className={buttonStyles({ variant: "secondary" })} href="/chat">チャット一覧へ戻る</Link>} title="チャット" />
        <ErrorMessage message={error instanceof ChatError ? error.message : "チャットを読み込めませんでした。"} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        action={<Link className={buttonStyles({ variant: "secondary" })} href="/chat">チャット一覧へ戻る</Link>}
        description={chatRoom.partnerPostTitle}
        title={chatRoom.otherUser.name}
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(query.error)} />
        <SuccessMessage message={singleParam(query.success)} />
        {chatRoom.isInteractionBlocked ? <ErrorMessage message="このユーザーとは現在やり取りできません。" /> : null}
      </div>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <Badge tone="emerald">承認済み</Badge>
          <span className="text-sm font-semibold text-slate-700">{chatRoom.partnerPostTitle}</span>
        </div>

        <div className="space-y-4">
          {chatRoom.messages.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">まだメッセージはありません。</p>
          ) : (
            chatRoom.messages.map((message) => (
              <div className={`flex ${message.isMine ? "justify-end" : "justify-start"}`} key={message.id}>
                <div className={`max-w-[min(100%,42rem)] space-y-2 ${message.isMine ? "items-end text-right" : "items-start text-left"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
                      message.isMine ? "bg-emerald-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  </div>
                  <div className={`flex flex-wrap items-center gap-2 text-xs text-slate-500 ${message.isMine ? "justify-end" : "justify-start"}`}>
                    <span>{message.isMine ? "自分" : message.sender.name}</span>
                    <span>{formatDateTime(message.createdAt)}</span>
                    {!message.isMine ? <MessageReportForm messageId={message.id} roomId={chatRoom.id} /> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form action={createChatMessageAction} className="border-t border-slate-100 pt-5">
          <input name="roomId" type="hidden" value={chatRoom.id} />
          <Field label="メッセージ">
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              disabled={chatRoom.isInteractionBlocked}
              maxLength={1000}
              name="body"
              placeholder={chatRoom.isInteractionBlocked ? "このユーザーとは現在やり取りできません。" : "日程や練習内容を相談しましょう。"}
              rows={4}
            />
          </Field>
          <div className="mt-4 flex justify-end">
            <SubmitButton className="w-full sm:w-auto" disabled={chatRoom.isInteractionBlocked}>
              送信
            </SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

function MessageReportForm({ messageId, roomId }: { messageId: string; roomId: string }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none font-semibold text-red-700 hover:underline">通報</summary>
      <form action={reportChatMessageAction} className="absolute right-0 z-10 mt-2 w-72 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl">
        <input name="roomId" type="hidden" value={roomId} />
        <input name="messageId" type="hidden" value={messageId} />
        <Field label="理由">
          <select className={inputClass} defaultValue="INAPPROPRIATE" name="reason">
            {reportReasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="詳細">
          <textarea className={`${inputClass} min-h-20 resize-y`} maxLength={500} name="details" rows={3} />
        </Field>
        <SubmitButton className="w-full" pendingLabel="送信中..." variant="danger">
          通報する
        </SubmitButton>
      </form>
    </details>
  );
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
