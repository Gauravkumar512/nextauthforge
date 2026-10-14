import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";
import { cx, dangerButton, primaryButton, secondaryButton } from "./ui";

interface SubmitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** Shows a spinner and disables the button while a request is pending. */
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  children: ReactNode;
}

const variants = { primary: primaryButton, secondary: secondaryButton, danger: dangerButton };

export function SubmitButton({
  loading = false,
  loadingText,
  variant = "primary",
  fullWidth = true,
  disabled,
  type = "submit",
  children,
  ...rest
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(variants[variant], fullWidth && "w-full")}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
