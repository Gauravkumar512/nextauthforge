// Runs `task` after the response has been sent, so response time doesn't
// depend on what the task does (e.g. whether an email was actually sent).
//
// This is the fallback used on Next.js < 15.1, which has no `after()`: the
// task is started but not awaited. On a long-running Node server that is fine.
// On serverless platforms the function may be frozen once the response is
// sent and the email may never go out, so upgrade to Next.js 15.1+ there
// (nextauthforge then generates the `after()`-based version of this file).
export function runAfterResponse(task: () => Promise<void>): void {
  void task().catch(() => {
    // Tasks are expected to log their own failures (without secrets).
  });
}
