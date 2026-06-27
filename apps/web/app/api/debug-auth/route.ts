import { auth } from "@/auth";
import { resolveSessionUserId } from "@/lib/session-user";

export async function GET() {
  const session = await auth();
  const userId = await resolveSessionUserId(session);

  return Response.json({
    hasSession: Boolean(session),
    hasUser: Boolean(session?.user),
    hasUserId: Boolean(userId)
  });
}
