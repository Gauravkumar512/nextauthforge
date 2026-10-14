# nextauthforge

A CLI that scaffolds email + password authentication into an existing Next.js App Router project. It copies plain, readable source files into your repo (no runtime package, no lock-in), installs the few dependencies they need, and wires up your environment files and root layout.

```bash
npx nextauthforge init
```

> Upgrading from 1.x? Read the [migration notes in the changelog](CHANGELOG.md#migrating-from-1x). 2.0 is a rewrite and is not drop-in compatible.

## Quick start

1. In the root of a Next.js project (App Router, TypeScript):

   ```bash
   npx nextauthforge init
   ```

2. Answer the prompts (or pass flags, see below). Use `--dry-run` first to see exactly what would happen.
3. Fill in `DATABASE_URL` in `.env.local` (`AUTH_SECRET` is generated for you).
4. **PostgreSQL only:** create the tables with `npx prisma migrate dev --name init`.
5. Start the app (`npm run dev`) and open `/signup`.

## What you get

- Sign up, log in, log out, "log out everywhere"
- Short-lived access JWT (15 min) plus a rotating refresh token (30 days) with reuse detection
- Email verification (optional gate before sign-in), forgot/reset password, change password, profile name update
- Email adapters: SMTP (nodemailer), Resend (plain `fetch`), or a development-only console adapter
- Databases: MongoDB (Mongoose) or PostgreSQL (Prisma), behind one small repository interface
- Route protection in `proxy.ts` (`middleware.ts` on Next < 16), same-origin checks on state-changing requests, zod validation, in-memory rate limiting
- Optional UI: sign-in/sign-up/password/verification pages, error and not-found pages, placeholder Terms/Privacy pages, a landing page and a small dashboard with settings. Styled with Tailwind plus CSS variables in `styles/authforge.css`
- Safe re-runs: existing files are never overwritten silently, `--dry-run` writes nothing, and running `init` twice changes nothing the second time

## Prompts and flags

Every prompt has a flag. A flag skips its prompt; `--yes` takes the default for any prompt that has no flag.

| Prompt | Flag | Default with `--yes` |
|--------|------|----------------------|
| Project name (brand in emails and UI) | `--name <name>` | `name` from your package.json |
| Database | `--db <mongodb\|postgresql>` | `mongodb` |
| How emails are sent | `--email <console\|smtp\|resend>` | `console` |
| Require email verification before sign-in | `--verify-email` / `--no-verify-email` | off |
| Auth pages, error/not-found and legal pages | `--ui` / `--no-ui` | on |
| Landing page | `--landing` / `--no-landing` | on |
| Example dashboard | `--dashboard` / `--no-dashboard` | on |
| | `-y, --yes` | skip all prompts |
| | `--force` | overwrite existing files (a `.bak` backup is written first) |
| | `--dry-run` | print what would happen, change nothing |
| | `--no-install` | don't install dependencies |

Existing files: interactively you are asked per file (skip / overwrite / overwrite with `.bak`). With `--yes` they are skipped unless you pass `--force`. This includes `prisma/schema.prisma`: an existing one is kept and you are told what to add by hand.

If you only choose `--no-ui`, the landing page and dashboard still link to `/login`, `/signup`, `/terms` and `/privacy`, which then won't exist (the CLI warns about this).

## Generated files

Paths are shown for the `src/` layout. With a root `app/` layout everything is the same without the `src/` prefix. The Prisma files always live at the project root.

```
src/
├─ app/
│  ├─ page.tsx                      landing page (landing option)
│  ├─ (auth)/login, signup, forgot-password, reset-password, verify-email   (ui option)
│  ├─ error.tsx, not-found.tsx, terms/, privacy/                           (ui option)
│  ├─ dashboard/page.tsx, settings/page.tsx                                (dashboard option)
│  └─ api/auth/
│     signup, login, logout, logout-all, refresh, me, profile,
│     forgot-password, reset-password, verify-email, resend-verification, change-password
├─ components/
│  ├─ auth/ landing/ dashboard/     UI kit and page sections
│  └─ ToasterProvider.tsx
├─ hooks/useAuth.tsx                <AuthProvider> and useAuth()
├─ styles/authforge.css             design tokens
├─ types/auth.ts
├─ lib/
│  ├─ auth-config.ts                cookies, TTLs, protected routes, password policy, rate limits
│  ├─ site-config.ts                landing page copy (landing option)
│  ├─ env.ts                        zod-validated environment variables
│  ├─ auth/                         service.ts, account.ts, server.ts, cookies.ts, tokens.ts, ...
│  ├─ email/                        sendEmail(), templates, and the adapter you chose
│  ├─ db/types.ts                   UserRepo / RefreshTokenRepo / TokenRepo interfaces
│  ├─ db/index.ts                   getDb()
│  ├─ db/mongo/                     MongoDB only: connection, models, repositories
│  ├─ db/postgres/                  PostgreSQL only: Prisma client singleton, repositories
│  ├─ db/generated/prisma/          PostgreSQL only: generated client (git-ignored)
│  ├─ jwt.ts, hash.ts, csrf.ts, rate-limit.ts, safe-redirect.ts, http.ts, api-client.ts, after.ts
└─ proxy.ts                         route protection (middleware.ts on Next < 16)
prisma/schema.prisma                PostgreSQL only (project root)
prisma.config.ts                    PostgreSQL only (project root)
.env.local                          created/extended by init (git-ignored)
.env.example                        documents every variable
```

Route handlers never touch the database directly. They call `lib/auth/service.ts` and `lib/auth/account.ts`, which only use the interfaces in `lib/db/types.ts`.

`init` also patches your root `layout.tsx` (writing a `.bak` first) to mount `<ToasterProvider />` and `<AuthProvider>`. If your layout has an unusual shape it is left alone and the exact snippet to add is printed.

Dependencies installed (pinned to the majors the templates were tested with): `jose@^6`, `bcryptjs@^3`, `react-hot-toast@^2`, `zod@^4`, plus `mongoose@^9` (MongoDB), `@prisma/client@^7` + `@prisma/adapter-pg@^7` with `prisma@^7` and `dotenv@^18` as dev dependencies (PostgreSQL), or `nodemailer@^10` + `@types/nodemailer@^8` (SMTP). After installing for PostgreSQL, `init` runs `npx prisma generate` (no database needed). It never runs migrations.

## Environment variables

`init` creates `.env.local` with a generated `AUTH_SECRET` and empty values to fill in. Existing env files are never overwritten; only missing keys are appended. `.env*` (except `.env.example`) is added to `.gitignore` if it isn't ignored already. Variables are validated by `lib/env.ts` on first use, with a clear error for anything missing or invalid.

| Variable | Required | Notes |
|----------|----------|-------|
| `AUTH_SECRET` | yes | 32+ characters. Signs the access JWT. Generated by `init`. |
| `APP_URL` | in production | Base URL for links in emails. Defaults to `http://localhost:3000`. |
| `EMAIL_PROVIDER` | no | `console` (default), `smtp` or `resend` |
| `EMAIL_FROM` | smtp, resend | e.g. `My App <noreply@example.com>` |
| `COOKIE_NAME` | no | Access cookie name, default `token` |

Per database:

| Database | `DATABASE_URL` must start with | Example |
|----------|--------------------------------|---------|
| MongoDB | `mongodb://` or `mongodb+srv://` | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| PostgreSQL | `postgresql://` or `postgres://` | `postgresql://user:password@localhost:5432/mydb` |

Per email provider:

| Provider | Needs |
|----------|-------|
| `console` | nothing. Prints each email, including its link, to the server log. Development only: it refuses to send in production. |
| `smtp` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`; optional `SMTP_SECURE` (defaults to true on port 465) |
| `resend` | `RESEND_API_KEY`, `EMAIL_FROM` |

## API routes

All routes validate input with zod, answer server errors with a generic message, and (for state-changing requests) check that `Origin`, falling back to `Referer`, matches the host.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | `name`, `email`, `password`, `confirmPassword`. Creates the user and sends a verification email. Signs the user in, unless verification is required. `409` if the email is registered. |
| `POST` | `/api/auth/login` | `email`, `password`. Same `401` for unknown email and wrong password. `403` `EMAIL_NOT_VERIFIED` when verification is required and the account is unverified. |
| `POST` | `/api/auth/logout` | Revokes this device's refresh token and clears both cookies. |
| `POST` | `/api/auth/logout-all` | Revokes every session of the user. Needs a session. |
| `POST` | `/api/auth/refresh` | Rotates the tokens (JSON). |
| `GET` | `/api/auth/refresh?next=/path` | Used by the proxy: rotates, then redirects to `next` (same-origin paths only) or `/login`. |
| `GET` | `/api/auth/me` | `id`, `name`, `email`, `emailVerified`, `createdAt` |
| `POST` | `/api/auth/forgot-password` | `email`. Same `200` whether or not the account exists. |
| `POST` | `/api/auth/reset-password` | `token`, `password`, `confirmPassword`. Single-use. Signs the user out everywhere. Does not sign in. |
| `POST` | `/api/auth/verify-email` | `token`. Single-use. |
| `POST` | `/api/auth/resend-verification` | `email`. Same `200` always; one email per 60 s per user. |
| `POST` | `/api/auth/change-password` | `currentPassword`, `newPassword`, `confirmPassword`. Needs a session. Revokes all sessions and starts a new one on this device. |
| `PATCH` | `/api/auth/profile` | `name`. Needs a session. |

Invalid, expired or already used reset/verify tokens all get the same `400`. Those tokens are random, valid for 24 h (verify) or 1 h (reset), and stored only as SHA-256 hashes.

## How sessions work

- **Access token:** an HS256 JWT in an `httpOnly` cookie, valid for 15 minutes.
- **Refresh token:** a random opaque token valid for 30 days, stored only as a SHA-256 hash, in an `httpOnly` cookie with `path=/api/auth`.
- **Rotation:** every refresh issues a new refresh token and revokes the old one, in one conditional database update.
- **Reuse detection:** presenting a token that was already rotated revokes its whole token family and clears the cookies, as it is assumed stolen.
- **10 second grace window:** a token rotated less than 10 seconds ago and presented again (two tabs refreshing at once) gets a `401` but revokes nothing, because the winning request already set new cookies. Tune it with `refreshReuseGraceSeconds` in `lib/auth-config.ts`.
- **Page navigations:** when a protected page is requested with an expired access token, `proxy.ts` redirects through `GET /api/auth/refresh?next=...`, which renews the session and sends the user back (or to `/login`). The proxy only uses `jose` and never touches the database.
- **Logout:** revokes the refresh token on the server and clears both cookies. The already-issued access token stays valid until it expires (up to 15 minutes). "Log out everywhere", password reset and password change revoke all of the user's refresh tokens.

## Customizing

- **Colours and radius:** edit the variables at the top of `styles/authforge.css` (`--af-accent`, `--af-radius`, ...). They are scoped to the `.af` class so they don't clash with your globals. If you change colours, re-check contrast yourself.
- **Landing page copy:** `lib/site-config.ts`. The text is placeholder; replace it.
- **Behaviour:** `lib/auth-config.ts` holds the app name, cookie names, token lifetimes, protected and auth-only routes, password rules, the verification requirement and every rate limit.
- **Switching email provider:** re-run `npx nextauthforge init --email smtp --force` (or `resend`, `console`). Only the adapter file and the env keys change, but `--force` also rewrites every other generated file (with `.bak` backups), so commit first and review the diff. To keep your edits elsewhere, answer "skip" file by file instead of using `--force`.
- **Rate limiter:** `lib/rate-limit.ts` exports `createMemoryRateLimiter`. Implement the two-method `RateLimiter` interface (`check`, `reset`) against Redis or Upstash and use it where the limiters are created in that file.
- **PostgreSQL maintenance:** Postgres has no TTL index. Expired tokens are deleted lazily when a user gets a new token, and `pruneExpired()` in `lib/db/index.ts` deletes the rest; call it from a cron job if you want.
- **Protected routes:** edit `protectedRoutes` and `authRoutes` in `lib/auth-config.ts`. In Server Components use `getCurrentUser()` or `requireUser()` from `lib/auth/server.ts`; in client components use `useAuth()`.

## Requirements and tested versions

- Next.js App Router, TypeScript. Tailwind is required for the UI templates (see limitations).
- Node.js 18.18+ to run the CLI itself. The generated app needs a Node version its packages support: Next.js 16 needs 20.9+, and `mongoose@9` and `prisma@7` need 20.19+ (the CLI warns when you run it on an older Node).

What was actually run:

| | Tested |
|---|---|
| Next.js | 14, 15 and 16 (Next 13 is accepted by the detection but was not tested) |
| Tailwind | 3.4 and 4 |
| Node.js | 22 for everything; Node 18.18 for the CLI dry-run only |
| OS | Windows 10 only. macOS and Linux were not tested. |
| Prisma | 7.10 against a real PostgreSQL (embedded-postgres), one smoke run |
| Browsers | Chromium. Firefox and WebKit were not tested. |
| Email | SMTP and Resend only against a fake SMTP server and intercepted `fetch`, never a real account |

## Known limitations

- The rate limiter is in memory, so limits are per server instance. Swap it for a shared store when you run more than one instance or on serverless.
- On Next.js < 15.1 the email after forgot-password is not awaited (there is no `after()`), so on serverless platforms it may never be sent. Use 15.1+ there.
- After logout the access token stays valid until it expires (up to 15 minutes).
- Two truly simultaneous refreshes outside the 10 second grace window end the session.
- Signup returns `409` for an existing email, so it reveals that an email is registered.
- The `console` email provider is for development only and refuses to run in production.
- The UI needs Tailwind. On Tailwind 3 a `content` setting that doesn't cover the generated folders only produces a warning from the CLI, and the pages come out unstyled until you fix it.
- Safari/WebKit may reject `Secure` cookies on plain `http://localhost` when running `next start` (use `next dev` or HTTPS). This was seen in one probe and not investigated further.
- Firefox and WebKit were not tested. Real SMTP and Resend accounts were not tested.
- Client IPs for rate limiting come from `x-forwarded-for`, which is only trustworthy behind a reverse proxy you control.

## Troubleshooting

**"Invalid environment variables" on the first request.** Check `.env.local`. `AUTH_SECRET` must be 32+ characters, and `DATABASE_URL` must use the scheme of the database you chose (see the table above).

**PostgreSQL: relation "User" does not exist.** Run `npx prisma migrate dev --name init`. `init` never runs migrations. In production use `npx prisma migrate deploy`.

**PostgreSQL: build fails with "Cannot find module '../generated/prisma/client'".** The generated client is git-ignored. Run `npx prisma generate`, and make sure it runs in CI/deploys, for example by adding `"postinstall": "prisma generate"` to your package.json scripts.

**"EMAIL_PROVIDER=console cannot send email in production".** That is deliberate. Re-run `init` with `--email smtp` or `--email resend`.

**Next.js 16 refuses to start: both middleware and proxy exist.** `init` skips `proxy.ts` and tells you when it finds a `middleware.ts`. Merge the two by hand.

**The pages are unstyled.** Install Tailwind, and on Tailwind 3 add `./app/**/*` and `./components/**/*` (with the `src/` prefix if you use it) to `content`.

**Where do emails go in development?** With the `console` provider, into the terminal running `next dev`, links included.

## Roadmap

Not built yet:

- OAuth sign-in (Google, GitHub)
- Session listing and per-device revocation
- Changing the account email
- Two-factor authentication
- A Redis/Upstash rate limiter
- Other database templates (MySQL, SQLite, ...)

## Developing locally

```bash
git clone https://github.com/Gauravkumar512/nextauthforge.git
cd nextauthforge
npm install
npm run build          # bundles src/ into dist/
npm link               # makes the `nextauthforge` command available globally
```

Then try it in a fresh app:

```bash
npx create-next-app@latest try-it --ts --tailwind --app
cd try-it
nextauthforge init --dry-run   # then without --dry-run
```

`npm run dev` runs the CLI straight from `src/` with tsx. `npm run typecheck` type-checks the CLI.

## Bugs and requests

[Open an issue](https://github.com/Gauravkumar512/nextauthforge/issues).

## License

MIT © Gaurav Kumar
