# nextauthforge

[![npm version](https://img.shields.io/npm/v/nextauthforge.svg)](https://www.npmjs.com/package/nextauthforge)
[![npm downloads](https://img.shields.io/npm/dm/nextauthforge.svg)](https://www.npmjs.com/package/nextauthforge)
[![license](https://img.shields.io/npm/l/nextauthforge.svg)](https://github.com/Gauravkumar512/nextauthforge/blob/main/LICENSE)

> Plug-and-play authentication scaffolding for Next.js App Router.  
> Add production-ready auth to any Next.js project in under a minute.

---

## Install & Run

```bash
npx nextauthforge init
```

No global install needed. Run it from the root of an existing Next.js project (App Router, TypeScript, Next.js 13+) and follow the prompts.

It detects your setup first: the Next.js version, whether you use `src/app/` or a root `app/`, TypeScript, Tailwind and your package manager (pnpm, yarn, bun or npm, from your lockfile). Files are written into the layout you already have; your `app/` is never moved.

### Flags

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip every prompt and use defaults |
| `--force` | Overwrite existing files (a `.bak` backup is written first) |
| `--dry-run` | Print what would be created / patched / skipped; change nothing |
| `--no-install` | Don't install dependencies |
| `--email <provider>` | How emails are sent: `smtp`, `resend` or `console` (default `console` with `--yes`) |
| `--verify-email` / `--no-verify-email` | Require / don't require email verification before sign-in (default off with `--yes`) |
| `--name <name>` | Project name (also the brand in emails) |
| `--db <mongodb>` | Database |
| `--ui` / `--no-ui` | Include / skip login & signup pages (and the landing page) |
| `--dashboard` / `--no-dashboard` | Include / skip the example dashboard |

Existing files are never silently skipped or overwritten. Interactively you are asked per file (skip / overwrite / overwrite with a `.bak` backup). With `--yes` they are skipped unless you pass `--force`.

---

## Demo

```
◆ NEXTAUTHFORGE — Next.js Auth Scaffolder

Detected: Next.js 16.1.0 · src/ layout · Tailwind · npm

? What is your project name? my-app
? Which database are you using? MongoDB
? Include login & signup pages? Yes
? Include example dashboard? Yes

✔ NEXTAUTHFORGE setup complete!

Files:
  created         src/app/api/auth/login/route.ts
  patched         src/app/layout.tsx  (backup: src/app/layout.tsx.bak)
  skipped         src/app/page.tsx  (already exists (kept))
  ...
```

---

## What Gets Scaffolded

Paths are relative to `src/` (or the project root if you use a root `app/`).

```
app/
 ├─ (auth)/login, signup, forgot-password, reset-password, verify-email   ← minimal pages
 ├─ api/auth/
 │   ├─ signup, login, logout, logout-all, refresh, me
 │   ├─ forgot-password, reset-password
 │   ├─ verify-email, resend-verification
 │   └─ change-password, profile
 ├─ dashboard/page.tsx                       ← Example protected page
 └─ page.tsx                                 ← Landing page
components/ToasterProvider.tsx
hooks/useAuth.tsx
lib/
 ├─ auth-config.ts      ← cookie names, TTLs, protected routes, password policy, rate limits
 ├─ auth/service.ts     ← register, login, refresh rotation, logout
 ├─ auth/account.ts     ← email verification, password reset/change, profile
 ├─ email/              ← sendEmail() + templates + the adapter you chose (smtp | resend | console)
 ├─ auth/server.ts      ← getCurrentUser() / requireUser() for Server Components
 ├─ auth/cookies.ts, auth/tokens.ts
 ├─ db/types.ts         ← UserRepo / RefreshTokenRepo / TokenRepo interfaces
 ├─ db/index.ts         ← getDb()  (database-specific)
 ├─ db/mongo/*          ← Mongoose connection, models, repositories
 ├─ jwt.ts, hash.ts, env.ts, validators.ts, after.ts
 ├─ csrf.ts, rate-limit.ts, safe-redirect.ts, http.ts
proxy.ts                ← Route protection (middleware.ts on Next < 16)
.env.local              ← generated AUTH_SECRET + the keys for your email provider
.env.example
```

Route handlers never touch the database directly: they call `lib/auth/service.ts`, which only uses the interfaces in `lib/db/types.ts`.

---

## Auth Flow

- **Access token:** a JWT (HS256, `iss`/`aud`/`sub` = user id) that expires after 15 minutes, in an `httpOnly` cookie.
- **Refresh token:** a random opaque token that expires after 30 days, stored only as a SHA-256 hash in the database. Its `httpOnly` cookie has `path=/api/auth`, so it is only sent to the auth routes.
- **Rotation:** every refresh issues a new refresh token and revokes the old one. Presenting a token that was already used or revoked revokes the whole token family and clears the cookies.
- **Page navigations:** when a protected page is requested with an expired access token, `proxy.ts` redirects through `GET /api/auth/refresh?next=...`, which renews the session and redirects back (or to `/login`). The proxy itself never touches the database.

```
Protected page
  │ valid access token ────────────────────────────► page
  │ no access cookie ──────────────────────────────► /login?next=<page>
  │ expired access token ─► /api/auth/refresh?next=<page>
  │                              │ ok ──────────────► <page> (new cookies)
  │                              └ failed ──────────► /login?next=<page>
```

Racing refreshes: a refresh token that was rotated less than `refreshReuseGraceSeconds` (10 by default, in `lib/auth-config.ts`) ago and is presented again is treated as a benign race (for example two tabs refreshing at once). That request gets a `401`, but nothing is revoked and the cookies are not cleared, because the winning request already set new ones. Reusing a rotated token after the window revokes the whole family.

---

## API Routes

All routes validate input with zod, return a generic `Something went wrong` on server errors, and check that `Origin` (or `Referer`) matches the host on state-changing requests.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | `name`, `email`, `password`, `confirmPassword`. Creates the user and sends a verification email. Signs them in, unless email verification is required (then `{ requiresVerification: true }` and no cookies). `409` if the email is already registered. |
| `POST` | `/api/auth/login` | `email`, `password`. Wrong email and wrong password return the same `401`. With verification required, the correct password of an unverified user gets `403` with code `EMAIL_NOT_VERIFIED`. |
| `POST` | `/api/auth/logout` | Revokes the refresh token server-side and clears both cookies. |
| `POST` | `/api/auth/logout-all` | Revokes every session of the user and clears this device's cookies. |
| `POST` | `/api/auth/refresh` | Rotates the tokens (JSON response). |
| `GET` | `/api/auth/refresh?next=/path` | Used by the proxy: rotates, then redirects to `next` (same-origin paths only) or `/login`. |
| `GET` | `/api/auth/me` | The current user: `id`, `name`, `email`, `emailVerified`, `createdAt`. |
| `POST` | `/api/auth/forgot-password` | `email`. Always the same `200`, whether or not the account exists; the email is sent after the response. |
| `POST` | `/api/auth/reset-password` | `token`, `password`, `confirmPassword`. Single-use token; signs the user out everywhere and sends a "password changed" email. Does not sign the user in. |
| `POST` | `/api/auth/verify-email` | `token`. Single-use token. |
| `POST` | `/api/auth/resend-verification` | `email`. Always the same `200`; at most one email per `resendCooldownSeconds` (60) per user. |
| `POST` | `/api/auth/change-password` | `currentPassword`, `newPassword`, `confirmPassword`. Needs a session. Revokes all sessions, gives this device a new one, sends a notice email. |
| `PATCH` | `/api/auth/profile` | `name`. Needs a session. (There is no email-change flow.) |

Invalid, expired or already used reset/verify tokens all get the same `400`. Tokens are random, valid for 24 hours (verify) / 1 hour (reset), and stored only as SHA-256 hashes.

---

## Environment Variables

`init` creates `.env.local` for you with a freshly generated `AUTH_SECRET`, the keys for the email provider you chose, and empty values for you to fill in (existing env files are never overwritten; only missing keys are appended).

```env
DATABASE_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dbname
AUTH_SECRET=generated-for-you-minimum-32-characters
APP_URL=http://localhost:3000        # base URL for links in emails; set your real URL in production
EMAIL_PROVIDER=smtp                  # smtp | resend | console
EMAIL_FROM=My App <noreply@example.com>
```

Provider specific keys:

| Provider | Needs |
|----------|-------|
| `smtp` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional `SMTP_SECURE`), `EMAIL_FROM`. Uses `nodemailer`. |
| `resend` | `RESEND_API_KEY`, `EMAIL_FROM`. Plain `fetch` against the Resend API (no SDK). |
| `console` | Nothing. Prints each email, including its link, to the server log. **Development only**: it refuses to send in production (and logs nothing there, since reset links are secrets). |

Only the adapter you chose at `init` is generated. Re-run `init --email <provider> --force` to switch.

`.env*` (except `.env.example`) is added to your `.gitignore` if it isn't ignored already.

Everything is validated with `zod` (`lib/env.ts`) when first used, with a clear error for anything missing or weak (for example an `AUTH_SECRET` shorter than 32 characters, or `smtp` without `SMTP_HOST`).
Optionally set `COOKIE_NAME` to override the session cookie name (default `token`).

### Email verification

Signup always sends a verification email. Whether it is *required* is the `requireEmailVerification` flag in `lib/auth-config.ts` (set by `--verify-email`). When it is on, signup doesn't sign the user in and login refuses unverified users. Use `requireUser({ verified: true })` in Server Components to send unverified users to `/verify-email`.

### `after()` and older Next.js

Forgot-password and resend-verification send their email after the response so the response time can't reveal whether an account exists. On Next.js 15.1+ this uses `after()`. On older versions the generated `lib/after.ts` starts the task without awaiting it, which works on a long-running Node server but may not on serverless platforms; use Next.js 15.1+ there.

---

## The Toaster

`init` mounts `<ToasterProvider />` inside `<body>` of your root layout automatically (writing `layout.tsx.bak` first, and doing nothing if it is already there). If your layout has an unusual shape it is left untouched and the exact snippet to add is printed:

```tsx
import { ToasterProvider } from "../components/ToasterProvider"

// inside <body>:
<ToasterProvider />
```

The import path is relative to your layout (`../components/...` for both `src/app/layout.tsx` and `app/layout.tsx`).

---

## Security Features

What the generated code does:

- ✅ Access and refresh tokens live in `httpOnly` cookies (`secure` in production, `sameSite=lax`)
- ✅ Refresh tokens are random, stored only as SHA-256 hashes, rotated on every use, with reuse detection and a TTL index
- ✅ bcryptjs password hashing (cost 12); the hash is never returned by the API or put in a token
- ✅ Login returns the same `401` for an unknown email and a wrong password, and does a dummy bcrypt compare so both take similar time
- ✅ Rate limiting (in memory, per server instance; swap in Redis/Upstash for multi-instance deployments) on login, signup, refresh and the password/verification routes, with `429` + `Retry-After`
- ✅ Forgot-password and resend-verification give the same response for known and unknown emails, and send the email after the response so timing does not differ
- ✅ Reset/verify tokens: random, single-use (consumed atomically), hashed at rest, newer tokens invalidate older ones; a password reset or change signs the user out everywhere and sends a notice email
- ✅ Same-origin check on every POST (`Origin`, falling back to `Referer`)
- ✅ `?next=` redirects only accept same-origin relative paths
- ✅ Signup returns `409` for an existing email, so it does reveal whether an account exists (a deliberate usability trade-off)
- ✅ The proxy only uses `jose`, so it is Edge Runtime compatible

Limits worth knowing: logging out revokes the refresh token, but an already-issued access token stays valid until it expires (15 minutes by default). Client IPs come from `x-forwarded-for`, which is only trustworthy behind a reverse proxy.

---

## Protected Routes

Edit `protectedRoutes` and `authRoutes` in `lib/auth-config.ts`. Out of the box:

```
/dashboard  → signed-in users only (otherwise /login?next=/dashboard)
/login      → redirects to /dashboard if already signed in
/signup     → redirects to /dashboard if already signed in
```

In Server Components use `getCurrentUser()` or `requireUser()` from `lib/auth/server.ts`.

## Dependencies Installed Automatically

| Package | Purpose |
|---------|---------|
| `jose` | JWT (Edge Runtime safe) |
| `bcryptjs` | Password hashing |
| `mongoose` | MongoDB ODM (database template) |
| `zod` | Input and env validation |
| `axios` | HTTP requests |
| `nodemailer` + `@types/nodemailer` | SMTP email (only with `--email smtp`) |
| `react-hot-toast` | Notifications |

---

## Roadmap

- [x] MongoDB + Mongoose
- [x] JWT httpOnly cookie auth
- [x] Middleware route protection
- [x] Login, Signup, Dashboard UI
- [x] Refresh tokens with rotation and reuse detection
- [ ] Google OAuth
- [ ] GitHub OAuth
- [x] Email verification, password reset, change password, profile update
- [ ] `nextauthforge add google` command

---

## Requirements

- Next.js 13+ (App Router) with TypeScript (Tailwind recommended for the UI templates)
- Node.js 18.18+
- MongoDB database (local or Atlas)

---

## Bug Reports & Feature Requests

[Open an issue on GitHub](https://github.com/Gauravkumar512/nextauthforge/issues)

---

## License

MIT © [Gaurav Kumar](https://github.com/Gauravkumar512)

---

<p align="center">Built for the Next.js community 🚀</p>