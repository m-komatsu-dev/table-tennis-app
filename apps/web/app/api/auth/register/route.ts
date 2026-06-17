import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";
import { dataResponse, errorResponse, validationErrorResponse } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existing) {
      return errorResponse("このメールアドレスはすでに登録されています", 400);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    return dataResponse(user, { status: 201 });
  } catch (error) {
    return validationErrorResponse(error);
  }
}
