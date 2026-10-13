import type { InputHTMLAttributes, ReactNode } from "react";
import { cx, inputClass, labelClass, mutedText } from "./ui";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  id: string;
  label: string;
  /** Helper text under the input (hidden while there is an error). */
  hint?: ReactNode;
  /** Error message, announced to screen readers. */
  error?: string;
  /** Something shown on the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  /** Extra content under the input (e.g. a strength meter). */
  below?: ReactNode;
}

/** Label + input + hint/error, wired up with aria-invalid and aria-describedby. */
export function FormField({ id, label, hint, error, labelAction, below, ...input }: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
      />
      {below}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-[color:var(--af-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={cx(mutedText, "mt-2 text-xs")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
