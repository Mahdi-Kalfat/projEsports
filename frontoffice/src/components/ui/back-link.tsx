import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Formalizes the "← All X" back-navigation pattern (design plan §6, tertiary
// button variant) — previously copy-pasted per page with drift between
// instances (some uppercase+tracked, some not; some hover:primary, some
// hover:foreground).
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition hover:text-primary"
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  );
}
