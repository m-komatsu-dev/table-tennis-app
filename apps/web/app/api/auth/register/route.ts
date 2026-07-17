import { dataResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { EmailAlreadyRegisteredError, LegalConsentRequiredError, registerUser } from "@/lib/register-user";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const user = await registerUser(body);

    return dataResponse(user, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return errorResponse("このメールアドレスはすでに登録されています", 400);
    }

    if (error instanceof LegalConsentRequiredError) {
      return errorResponse(error.message, 400);
    }

    return validationErrorResponse(error);
  }
}
