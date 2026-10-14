# Changelog

## 2.0.0

A ground-up rewrite. The CLI is now a safe, re-runnable scaffolder and the generated code is a complete auth system rather than a starter.

### Added

- **Sessions:** 15 minute access JWT plus a 30 day rotating refresh token, stored hashed, with reuse detection (a replayed token revokes its whole family) and a 10 second grace window for benign races.
- **Account flows:** email verification (optionally required before sign-in), forgot/reset password, change password, profile name update, "log out everywhere".
- **PostgreSQL (Prisma 7) template** next to MongoDB, behind the same repository interfaces, with atomic token consumption and refresh rotation. `--db postgresql`.
- **Email adapters:** SMTP (nodemailer), Resend (plain `fetch`) and a development-only console adapter. `--email smtp|resend|console`.
- **Optional UI:** sign-in, sign-up, forgot/reset password and verify-email pages, error and not-found pages, placeholder Terms/Privacy pages, a landing page driven by `lib/site-config.ts`, and a dashboard with settings. Design tokens live in `styles/authforge.css`.
- **Safety:** same-origin checks on state-changing requests, zod validation of input and environment, in-memory rate limiting (`429` with `Retry-After`), constant-ish-time login for unknown emails, same-origin-only `?next=` redirects.
- **A safer CLI:** detects the Next.js version, `src/` or root `app/` layout, Tailwind and package manager; `--dry-run`, `--yes`, `--force` (with `.bak` backups), per-file conflict prompts, idempotent re-runs, flags for every prompt, `.env.local` creation with a generated `AUTH_SECRET`, `.env.example`, `.gitignore` handling and a safe patch of your root layout.
- `proxy.ts` on Next.js 16 and `middleware.ts` on older versions; `after()` for emails on Next.js 15.1+.
- Template dependencies are pinned to the tested majors (`jose@^6`, `bcryptjs@^3`, `zod@^4`, `mongoose@^9`, `prisma@^7`, `react-hot-toast@^2`, `nodemailer@^10`).

### Changed

- Your `app/` folder is no longer moved into `src/`. Files go into the layout you already have.
- The CLI is bundled into one file and runs on Node 18.18+. The generated app needs a Node version its packages support (`mongoose@9` and `prisma@7` need 20.19+).

### Removed

- `axios` (the client uses `fetch`) and the `bcrypt` native module (replaced by `bcryptjs`).

### Known limitations

See the "Known limitations" section of the README.

### BREAKING CHANGES

2.0 changes the user model, the environment variables, the session cookies and the file layout. Plan for a re-login of all users and a one-off data migration.

| 1.x | 2.0 |
|-----|-----|
| user field `username` | `name` |
| user field `password` (bcrypt hash) | `passwordHash` |
| `TOKEN_SECRET` | `AUTH_SECRET` (must be 32+ characters) |
| `DB_CONFIG` | `DATABASE_URL` |
| `COOKIE_NAME` (required) | `COOKIE_NAME` optional, defaults to `token`; plus a second `refresh_token` cookie (`path=/api/auth`) |
| one 1-day JWT, no refresh | 15 min access JWT + rotating refresh token |
| `bcrypt` (native) | `bcryptjs` (it verifies existing bcrypt hashes, so passwords keep working) |
| `axios` in the client | `fetch` (`lib/api-client.ts`) |
| `proxy.ts` on every Next.js version | `proxy.ts` on Next 16+, `middleware.ts` below |
| `src/lib/dbConfig.ts`, `src/lib/session.ts`, `src/models/user.models.js`, `@/src/...` imports | `lib/db/*`, `lib/auth/*`, relative imports; no `@/src` alias needed |
| `app/` moved into `src/` | layout left as it is |

### Migrating from 1.x

1. **Commit everything first**, so you can review what the re-run changes.
2. Run `npx nextauthforge init --force` in the project. Existing files that differ are overwritten with a `.bak` backup next to them (or answer the per-file prompts without `--force` to keep specific files). Your root layout is patched, not replaced.
3. **Delete by hand** what 2.0 no longer uses: `lib/dbConfig.ts`, `lib/session.ts`, `models/user.models.js` (under `src/` if you had it there), and the old `DB_CONFIG` / `TOKEN_SECRET` lines in your env files. Remove the `bcrypt`, `@types/bcrypt` and `axios` dependencies if nothing else uses them. If you had customised the old routes or pages, port those changes into the new files (the `.bak` copies help).
4. **Environment:** rename `DB_CONFIG` to `DATABASE_URL` and `TOKEN_SECRET` to `AUTH_SECRET`. `init` adds `AUTH_SECRET` to `.env.local` if missing, but if you carry over your old `TOKEN_SECRET` make sure it is 32+ characters. Set `APP_URL` for production.
5. **Existing MongoDB users:** documents need the new field names. For the default `users` collection:

   ```js
   db.users.updateMany({}, { $rename: { username: "name", password: "passwordHash" } })
   ```

   Existing bcrypt hashes keep working with `bcryptjs`. Users also need `emailVerifiedAt` only if you require verification; set it for accounts you trust (`db.users.updateMany({}, { $set: { emailVerifiedAt: new Date() } })`), otherwise they will be asked to verify.
6. **Sessions:** 1.x tokens are not valid in 2.0 (they lack the issuer, audience and subject claims), so every user has to sign in once after the upgrade.
7. **Next.js < 16:** make sure there is no leftover `proxy.ts` from 1.x next to the new `middleware.ts` (and on Next 16 no leftover `middleware.ts` next to `proxy.ts`).
8. Choose an email provider (`--email smtp|resend`) before deploying; the default `console` provider refuses to run in production.

## 1.0.3 and earlier

Initial MongoDB-only starter: signup, login, logout, `/me`, a single 1-day JWT cookie, optional login/signup pages and dashboard.
