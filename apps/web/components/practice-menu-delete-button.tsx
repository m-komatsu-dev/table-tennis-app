"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { ApiResponse } from "@/types/app";

export function PracticeMenuDeleteButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("この練習メニューを削除しますか？\n紐づいている練習記録は削除されません。")) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/practice-menus/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;
      if (!response.ok) {
        window.alert(payload.error ?? "練習メニューの削除に失敗しました");
        return;
      }
      router.push("/practice-menus");
      router.refresh();
    } catch {
      window.alert("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsDeleting(false);
    }
  }

  return <Button className={compact ? "min-h-9 px-3" : ""} disabled={isDeleting} onClick={handleDelete} type="button" variant="danger">{isDeleting ? "削除中..." : "削除"}</Button>;
}
