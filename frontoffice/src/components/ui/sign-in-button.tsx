import Link from "next/link";
import { LogIn } from "lucide-react";

// Swapped in for guests wherever a real action (join, buy, claim, spin,
// unlock) would otherwise sit. Deliberately styled as an inviting primary
// CTA rather than LockedButton's greyed-out "not available" look — the gate
// here is just "you don't have an account yet," not a feature that's
// unavailable, so it should read as an invitation, not a dead end.
export function SignInToContinueButton({
  label = "Sign in to continue",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href="/login"
      className={`btn-neon flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition hover:bg-primary-glow ${className}`}
    >
      <LogIn size={12} />
      {label}
    </Link>
  );
}
