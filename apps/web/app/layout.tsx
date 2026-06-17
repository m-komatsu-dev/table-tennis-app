import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table Tennis Log",
  description: "卓球プレイヤーの練習・試合・用具・統計管理"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
