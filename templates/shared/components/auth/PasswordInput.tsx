"use client";

import { useState } from "react";
import type { FieldProps } from "./FormField";
import { EyeIcon, EyeOffIcon } from "./icons";
import { cx, inputClass, labelClass, mutedText } from "./ui";

/** A password field with a show/hide toggle. Pass the right `autoComplete`. */
export function PasswordInput({ id, label, hint, error, labelAction, below, ...input }: FieldProps) {
  const [visible, setVisible] = useState(false);
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
      <div className="relative">
        <input
          id={id}
          {...input}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(inputClass, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-[var(--af-radius)] text-[color:var(--af-muted)] hover:text-[color:var(--af-text)]"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
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
