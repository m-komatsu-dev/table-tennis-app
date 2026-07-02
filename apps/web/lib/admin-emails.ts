export function getAdminEmailSet(adminEmails = process.env.ADMIN_EMAILS) {
  return new Set(
    (adminEmails ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined, adminEmails = process.env.ADMIN_EMAILS) {
  if (!email) {
    return false;
  }

  return getAdminEmailSet(adminEmails).has(email.trim().toLowerCase());
}
