import Link from "next/link";
import { authConfig } from "../../lib/auth-config";
import { cx } from "./ui";

// The brand is the project name from lib/auth-config.ts (appName).
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cx(
        "inline-flex items-center gap-2.5 rounded font-mono text-lg font-black tracking-tight text-[color:var(--af-text)]",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 rounded-[4px] bg-[color:var(--af-accent)]"
      />
      <span>{authConfig.appName}</span>
    </Link>
  );
}
