import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, SuccessMessage, buttonStyles } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { getNotificationsForUser, type SerializedNotification } from "@/lib/notifications";
import { getRequiredUserId } from "@/lib/server-auth";
import { markAllNotificationsReadAction, markNotificationReadAction, openNotificationAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
};

export default async function NotificationsPage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const query = await searchParams;
  const { notifications, unreadCount } = await getNotificationsForUser(userId);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        action={
          notifications.length > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button variant="secondary">すべて既読</Button>
            </form>
          ) : null
        }
        description={unreadCount > 0 ? `未読通知が${unreadCount}件あります。` : "新しい未読通知はありません。"}
        title="お知らせ"
      />
      <div className="mb-5 space-y-3">
        <ErrorMessage message={singleParam(query.error)} />
        <SuccessMessage message={singleParam(query.success)} />
      </div>

      {notifications.length === 0 ? (
        <EmptyState>
          <p className="font-semibold text-slate-800">現在、お知らせはありません。</p>
          <p className="mt-1">新しいチャットメッセージなどが届くと、ここに表示されます。</p>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard item={notification} key={notification.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ item }: { item: SerializedNotification }) {
  return (
    <Card className={item.isRead ? "border-slate-200/80" : "border-emerald-200 bg-emerald-50/50"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={item.type === "CHAT_MESSAGE" ? "blue" : "slate"}>{labelForNotification(item.type)}</Badge>
            {item.isRead ? <Badge>既読</Badge> : <Badge tone="emerald">未読</Badge>}
            <span className="text-xs font-semibold text-slate-500">{formatDateTime(item.createdAt)}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-950">{item.title}</h2>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600">{item.body}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-40">
          {item.actionPath ? (
            <form action={openNotificationAction}>
              <input name="notificationId" type="hidden" value={item.id} />
              <button className={buttonStyles({ className: "w-full" })}>開く</button>
            </form>
          ) : null}
          <form action={markNotificationReadAction}>
            <input name="notificationId" type="hidden" value={item.id} />
            <button className={buttonStyles({ className: "w-full", variant: "secondary" })} disabled={item.isRead}>
              {item.isRead ? "既読済み" : "既読にする"}
            </button>
          </form>
        </div>
      </div>
    </Card>
  );
}

function labelForNotification(type: SerializedNotification["type"]) {
  if (type === "CHAT_MESSAGE") {
    return "チャット";
  }

  if (type === "PARTNER_REQUEST_ACCEPTED" || type === "PARTNER_REQUEST_RECEIVED") {
    return "マッチング";
  }

  return "お知らせ";
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
