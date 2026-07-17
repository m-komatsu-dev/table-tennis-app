import { createMobileAccessToken, MobileAuthConfigError } from "@/lib/mobile-auth";
import { mobileError, mobileJson, mobileValidationError } from "@/lib/mobile-api";
import { EmailAlreadyRegisteredError, LegalConsentRequiredError, registerUser } from "@/lib/register-user";
import { mobileRegisterSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = mobileRegisterSchema.parse(await request.json());
    const user = await registerUser(body);
    const accessToken = createMobileAccessToken(user.id);

    return mobileJson({ accessToken, user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return mobileError("このメールアドレスはすでに登録されています", 409);
    }

    if (error instanceof LegalConsentRequiredError) {
      return mobileError(error.message, 400);
    }

    if (error instanceof MobileAuthConfigError) {
      return mobileError("モバイル認証設定が不足しています", 500);
    }

    return mobileValidationError(error);
  }
}
