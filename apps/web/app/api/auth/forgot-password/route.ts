import { dataResponse, validationErrorResponse } from "@/lib/api";
import {
  PASSWORD_RESET_REQUEST_MESSAGE,
  requestPasswordReset
} from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/validators";

function getRequestKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function successResponse() {
  return dataResponse({ message: PASSWORD_RESET_REQUEST_MESSAGE });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return validationErrorResponse(new Error("Invalid JSON"));
  }

  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    await requestPasswordReset(
      parsed.data.email,
      new URL(request.url).origin,
      getRequestKey(request)
    );
  } catch {
    return successResponse();
  }

  return successResponse();
}
