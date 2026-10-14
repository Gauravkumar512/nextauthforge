import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon } from "./icons";
import { cx } from "./ui";

const tones = {
  error: {
    box: "border-[color:var(--af-danger)] bg-[color:var(--af-danger-soft)]",
    icon: "text-[color:var(--af-danger)]",
    Icon: AlertIcon,
  },
  success: {
    box: "border-[color:var(--af-success)] bg-[color:var(--af-success-soft)]",
    icon: "text-[color:var(--af-success)]",
    Icon: CheckIcon,
  },
  info: {
    box: "border-[color:var(--af-info)] bg-[color:var(--af-info-soft)]",
    icon: "text-[color:var(--af-info)]",
    Icon: InfoIcon,
  },
};

/** Inline message. Errors are announced immediately (role="alert"), the rest politely. */
export function FormAlert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex gap-3 rounded-[var(--af-radius)] border p-3.5 text-sm text-[color:var(--af-text)]",
        box,
        className
      )}
    >
      <Icon className={cx("mt-0.5 h-5 w-5 shrink-0", icon)} />
      <div className="min-w-0 break-words leading-relaxed">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}
