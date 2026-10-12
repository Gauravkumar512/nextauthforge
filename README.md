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
| `--name <name>` | Project name |
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

```
your-project/
 ├─ src/            ← or the project root, if you use a root app/
 │   ├─ app/
 │   │   ├─ (auth)/
 │   │   │   ├─ login/page.tsx         ← Login UI
 │   │   │   └─ signup/page.tsx        ← Signup UI
 │   │   ├─ api/auth/
 │   │   │   ├─ login/route.ts         ← POST /api/auth/login
 │   │   │   ├─ signup/route.ts        ← POST /api/auth/signup
 │   │   │   ├─ logout/route.ts        ← POST /api/auth/logout
 │   │   │   └─ me/route.ts            ← GET  /api/auth/me
 │   │   ├─ dashboard/page.tsx         ← Protected dashboard
 │   │   └─ page.tsx                   ← Landing page
 │   ├─ components/ToasterProvider.tsx
 │   ├─ hooks/useAuth.tsx
 │   ├─ lib/
 │   │   ├─ dbConfig.ts
 │   │   ├─ hash.ts
 │   │   ├─ jwt.ts
 │   │   └─ session.ts
 │   ├─ models/user.models.js
 │   └─ proxy.ts                       ← Route protection (middleware.ts on Next < 16)
 ├─ .env.local                         ← DATABASE_URL + generated AUTH_SECRET
 └─ .env.example
```

---

## Auth Flow

```
Browser
  │
  │  POST /api/auth/login
  ▼
Route Handler
  │  validate → hash → JWT → httpOnly cookie
  ▼
MongoDB
  │
  ▼
Cookie in browser → proxy.ts (middleware.ts on Next < 16) verifies on every protected route
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register + auto login |
| `POST` | `/api/auth/login` | Login + set cookie |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current user |

---

## Environment Variables

`init` creates `.env.local` for you with a freshly generated `AUTH_SECRET` and an empty `DATABASE_URL` (existing env files are never overwritten; only missing keys are appended). Fill in `DATABASE_URL`:

```env
DATABASE_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dbname
AUTH_SECRET=generated-for-you-minimum-32-characters
```

`.env*` (except `.env.example`) is added to your `.gitignore` if it isn't ignored already.

Both are validated with `zod` (`src/lib/env.ts`); a missing or short `AUTH_SECRET` throws a clear error.
Optionally set `COOKIE_NAME` to override the session cookie name (default `token`).

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

- ✅ JWT in `httpOnly` cookie — immune to XSS
- ✅ `secure` flag on in production
- ✅ `sameSite: lax` CSRF protection
- ✅ bcryptjs password hashing (12 rounds)
- ✅ Password never in JWT payload
- ✅ Generic error messages — no email enumeration
- ✅ `jose` library — Edge Runtime compatible

---

## Protected Routes

Middleware protects these routes out of the box:

```
/dashboard  → JWT required
/profile    → JWT required
/settings   → JWT required
/login      → redirects to /dashboard if already logged in
/signup     → redirects to /dashboard if already logged in
```

## Dependencies Installed Automatically

| Package | Purpose |
|---------|---------|
| `jose` | JWT (Edge Runtime safe) |
| `bcryptjs` | Password hashing |
| `mongoose` | MongoDB ODM |
| `axios` | HTTP requests |
| `react-hot-toast` | Notifications |

---

## Roadmap

- [x] MongoDB + Mongoose
- [x] JWT httpOnly cookie auth
- [x] Middleware route protection
- [x] Login, Signup, Dashboard, Profile UI
- [ ] Refresh tokens
- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] Email verification
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