"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * After a failed submit, moves keyboard focus to the first invalid field so
 * keyboard and screen reader users land on the problem.
 */
export function useFocusFirstError(errors: Record<string, string>, formRef: RefObject<HTMLElement | null>) {
  const count = Object.keys(errors).length;
  useEffect(() => {
    if (count === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [count, errors, formRef]);
}
