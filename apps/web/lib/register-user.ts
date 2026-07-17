import bcrypt from "bcryptjs";
import { prisma } from "@table-tennis/db";
import { legalConfig, legalConsentRequiredMessage } from "@/lib/legal-config";

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email is already registered.");
  }
}

export class LegalConsentRequiredError extends Error {
  constructor() {
    super(legalConsentRequiredMessage);
  }
}

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  legalConsent: boolean;
};

export async function registerUser(input: RegisterUserInput) {
  if (input.legalConsent !== true) {
    throw new LegalConsentRequiredError();
  }

  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existing) {
    throw new EmailAlreadyRegisteredError();
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    return await prisma.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        legalConsentAt: new Date(),
        termsVersion: legalConfig.termsVersion,
        privacyPolicyVersion: legalConfig.privacyVersion
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new EmailAlreadyRegisteredError();
    }

    throw error;
  }
}
