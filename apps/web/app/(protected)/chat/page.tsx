import Link from "next/link";
import { EmptyState, ErrorMessage, PageHeader, SuccessMessage, buttonStyles } from "@/components/ui";
import { getChatRoomsForUser } from "@/lib/chat";
import { formatDateTime } from "@/lib/format";
import { getRequiredUserId } from "@/lib/server-auth";

type PageProps = {
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

export default async function ChatPage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const query = await searchParams;

  try {
    const chatRooms = await getChatRoomsForUser(userId);

    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          action={<Link className={buttonStyles({ variant: "secondary" })} href="/partner-posts">募集を見る</Link>}
          description="承認済みの参加希望に紐づく、掲示板型の簡易メッセージです。"
          title="チャット"
        />
        <div className="mb-5 space-y-3">
          <ErrorMessage message={singleParam(query.error)} />
          <SuccessMessage message={singleParam(query.success)} />
        </div>

        {chatRooms.length === 0 ? (
          <EmptyState>
            <p className="font-semibold text-slate-800">まだチャットはありません。</p>
            <p className="mt-1">参加希望が承認されると、ここにチャットが表示されます。</p>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {chatRooms.map((room) => (
              <Link
                className={`block rounded-2xl border p-5 shadow-sm shadow-slate-900/4 transition hover:border-emerald-200 hover:shadow-md ${
                  room.unreadCount > 0 ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200/80 bg-white"
                }`}
                href={`/chat/${room.id}`}
                key={room.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-slate-950">{room.otherUser.name}</h2>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        募集: {room.partnerPostTitle}
                      </span>
                      {room.unreadCount > 0 ? (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                          未読 {room.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-3 line-clamp-2 break-words text-sm leading-6 ${room.unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                      {room.lastMessage ? room.lastMessage.body : "まだメッセージはありません。"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-slate-500">
                    {room.lastMessage ? formatDateTime(room.lastMessage.createdAt) : formatDateTime(room.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="チャット" />
        <ErrorMessage message="チャットを読み込めませんでした。" />
      </div>
    );
  }
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
