import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export function PublicProfileLink({
  publicProfileEnabled,
  username
}: {
  publicProfileEnabled: boolean;
  username: string | null;
}) {
  if (!publicProfileEnabled || !username) {
    return <span className="text-slate-500">非公開</span>;
  }

  return (
    <Link className={buttonStyles({ variant: "secondary", className: "min-h-10 px-3" })} href={`/u/${username}`}>
      公開プロフィールを見る
    </Link>
  );
}
