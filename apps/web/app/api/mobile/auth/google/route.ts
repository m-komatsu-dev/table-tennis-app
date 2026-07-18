import { mobileError } from "@/lib/mobile-api";

export const runtime = "nodejs";

export async function POST() {
  return mobileError("Googleログインはブラウザ方式でやり直してください", 410);
}
