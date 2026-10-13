// Small fetch wrapper for the browser: JSON in/out, same-origin cookies, and
// one silent session refresh when an access token has expired.

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Field-level messages from the server, e.g. { email: "Enter a valid email address" }. */
  fields?: Record<string, string>;
  retryAfterSeconds?: number;

  constructor(
    status: number,
    message: string,
    extra: { code?: string; fields?: Record<string, string>; retryAfterSeconds?: number } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = extra.code;
    this.fields = extra.fields;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

// On these endpoints a 401 means "wrong credentials / no session", not "your
// access token expired", so a refresh would not help.
const NO_REFRESH = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
]);

// The refresh token cookie is httpOnly, so the browser can't tell whether a
// session exists. This flag remembers that this browser signed in, which lets
// signed-out visitors skip pointless refresh requests.
const HINT_KEY = "af_session";

export const sessionHint = {
  get(): boolean {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(HINT_KEY) === "1";
    } catch {
      return false;
    }
  },
  set() {
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {}
  },
  clear() {
    try {
      window.localStorage.removeItem(HINT_KEY);
    } catch {}
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Single flight: concurrent 401s share one refresh request.
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
      .then(
        (response) => response.ok,
        () => false
      )
      .then((ok) => {
        refreshInFlight = null;
        return ok;
      });
  }
  return refreshInFlight;
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Try a silent refresh on a 401 (default true; ignored for credential endpoints). */
  refresh?: boolean;
  /** After a failed refresh: go to /login?next=... (default) or just throw. */
  onAuthFail?: "redirect" | "throw";
}

/** Full page navigation (used when a session ends and client state must be dropped). */
export function hardNavigate(path: string): void {
  window.location.href = path;
}

function goToLogin(): void {
  const here = window.location.pathname + window.location.search;
  hardNavigate(`/login?next=${encodeURIComponent(here)}`);
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = options.body === undefined ? "GET" : "POST", body, refresh = true, onAuthFail = "redirect" } = options;

  const attempt = () =>
    fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await attempt();

  if (response.status === 401 && refresh && !NO_REFRESH.has(path)) {
    const renewed = await refreshSession();
    // If our refresh lost a race with another tab, the winner has already put
    // fresh cookies in the shared cookie jar: give it a moment, then retry.
    if (!renewed) await sleep(250);
    response = await attempt();

    if (response.status === 401) {
      sessionHint.clear();
      if (onAuthFail === "redirect" && typeof window !== "undefined") goToLogin();
    }
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // empty or non-JSON body
  }

  if (!response.ok) {
    const body = (data ?? {}) as { error?: string; code?: string; fields?: Record<string, string> };
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new ApiError(response.status, body.error || "Something went wrong", {
      code: body.code,
      fields: body.fields,
      retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    });
  }

  if (path === "/api/auth/me" || path === "/api/auth/login" || path === "/api/auth/change-password") {
    sessionHint.set();
  }
  if (path === "/api/auth/signup" && (data as { user?: unknown } | null)?.user) sessionHint.set();
  if (path === "/api/auth/logout" || path === "/api/auth/logout-all") sessionHint.clear();

  return data as T;
}

/** "5 minutes", "1 hour", ... for a Retry-After value. */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

/** The best message to show for any error thrown by `api()`. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Too many attempts. Please try again in ${formatWait(error.retryAfterSeconds)}.`
        : "Too many attempts. Please try again later.";
    }
    return error.message;
  }
  return "Something went wrong";
}
