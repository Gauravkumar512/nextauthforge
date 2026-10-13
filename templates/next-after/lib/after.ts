import { after } from "next/server";

// Runs `task` after the response has been sent, so response time doesn't
// depend on what the task does (e.g. whether an email was actually sent).
// Uses Next.js's `after()` (stable since 15.1).
export function runAfterResponse(task: () => Promise<void>): void {
  after(async () => {
    try {
      await task();
    } catch {
      // Tasks are expected to log their own failures (without secrets).
    }
  });
}
