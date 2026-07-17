import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";

export const PASSWORD_CHANGE_SUCCESS_MESSAGE =
  "パスワードを変更しました。新しいパスワードでログインしてください。";

export type PasswordChangeFailureCode = "unavailable" | "incorrect_current" | "failed";

export class PasswordChangeError extends Error {
  constructor(readonly code: PasswordChangeFailureCode) {
    super(code);
  }
}

type ChangePasswordDeps = {
  comparePassword?: (password: string, passwordHash: string) => Promise<boolean>;
  hashPassword?: (password: string) => Promise<string>;
};

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  deps: ChangePasswordDeps = {}
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user?.passwordHash) {
    throw new PasswordChangeError("unavailable");
  }

  const comparePassword = deps.comparePassword ?? bcrypt.compare;
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new PasswordChangeError("incorrect_current");
  }

  const hashPassword = deps.hashPassword ?? ((value: string) => bcrypt.hash(value, 12));
  const passwordHash = await hashPassword(newPassword);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
      select: { id: true }
    });
  } catch {
    throw new PasswordChangeError("failed");
  }
}
