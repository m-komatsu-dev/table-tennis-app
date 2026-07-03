"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function SubmitButton({
  children,
  className,
  disabled = false,
  pendingLabel = "送信中...",
  variant
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} disabled={disabled || pending} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
