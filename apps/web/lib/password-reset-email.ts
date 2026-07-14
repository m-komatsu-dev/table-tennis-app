export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export type PasswordResetEmailResult = {
  skipped: boolean;
};

export async function sendPasswordResetEmail({
  to,
  resetUrl
}: PasswordResetEmailInput): Promise<PasswordResetEmailResult> {
  const from = process.env.EMAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  if (!from || !apiKey) {
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "パスワード再設定のご案内",
      text: [
        "Table Tennis Logのパスワード再設定を受け付けました。",
        "以下のURLから30分以内に新しいパスワードを設定してください。",
        "",
        resetUrl,
        "",
        "このメールに心当たりがない場合は、このまま破棄してください。"
      ].join("\n")
    })
  });

  if (!response.ok) {
    throw new Error("Password reset email delivery failed.");
  }

  return { skipped: false };
}
