"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/practice", label: "練習" },
  { href: "/match", label: "試合" },
  { href: "/equipment", label: "用具" },
  { href: "/profile", label: "プロフィール" }
];

export function ProtectedNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-3 py-2 font-medium transition ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
