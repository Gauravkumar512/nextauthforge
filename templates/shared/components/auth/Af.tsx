import type { ReactNode } from "react";
import "../../styles/authforge.css";
import { cx } from "./ui";

/**
 * Wraps a page in the nextauthforge tokens (`.af`) and the dark page
 * background. Importing it also loads styles/authforge.css.
 */
export function Af({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("af af-page min-h-screen", className)}>{children}</div>;
}
