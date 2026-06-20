import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="min-w-0">
        <div className="mb-2 h-1 w-10 rounded-full bg-emerald-500" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
      </div>
      {action ? <div className="sm:shrink-0">{action}</div> : null}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={buttonStyles({ className: "w-full sm:w-auto" })}
    >
      {children}
    </Link>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function buttonStyles({
  variant = "primary",
  className = ""
}: {
  variant?: ButtonVariant;
  className?: string;
} = {}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700",
    secondary: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50",
    danger: "border border-red-200 bg-white text-red-700 shadow-sm hover:bg-red-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  };

  return `inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={buttonStyles({ variant, className })} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.04] ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-sm shadow-slate-900/[0.03] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div aria-live="polite" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
      <span aria-hidden="true" className="mt-0.5">!</span>
      <span>{message}</span>
    </div>
  );
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div aria-live="polite" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
      <span aria-hidden="true">✓</span>
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-5 py-12 text-center shadow-sm shadow-slate-900/[0.03]">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-xl text-emerald-700" aria-hidden="true">＋</div>
      <div className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">{children}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "emerald" | "blue" | "red" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    red: "bg-red-50 text-red-700 ring-red-200"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}>
      {children}
    </span>
  );
}
