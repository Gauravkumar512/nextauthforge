import { z } from "zod";
import { authConfig } from "./auth-config";

const email = z
  .string({ message: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Enter a valid email address");

const password = z
  .string({ message: "Password is required" })
  .min(authConfig.password.minLength, `Password must be at least ${authConfig.password.minLength} characters`)
  .max(authConfig.password.maxLength, `Password must be at most ${authConfig.password.maxLength} characters`);

const name = z
  .string({ message: "Name is required" })
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be at most 80 characters");

export const signupSchema = z
  .object({
    name,
    email,
    password,
    confirmPassword: z.string({ message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email,
  // No policy check on login (older accounts may predate it), just a sane cap.
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .max(authConfig.password.maxLength, "Password is too long"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** First message per field, e.g. { email: "Enter a valid email address" }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}
