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

No global install needed. Just run and follow the prompts.

---

## Demo

```
◆ AUTHFORGE — Next.js Auth Scaffolder

? What is your project name? my-app
? Which database are you using? MongoDB
? Include login & signup pages? Yes
? Include example dashboard & profile pages? Yes

✓ Auth files scaffolded
✓ Dependencies installed
✓ AuthForge setup complete!
```

---

## What Gets Scaffolded

```
your-project/
 ├─ src/
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
 │   └─ models/user.models.js
 └─ proxy.ts                           ← Route protection middleware
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
Cookie in browser → proxy.ts verifies on every protected route
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

Create `.env.local` in your project root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dbname
TOKEN_SECRET=your-secret-key-minimum-32-characters
```

---

## After Init — One Manual Step

Add `<ToasterProvider />` to your `src/app/layout.tsx`:

```tsx
import ToasterProvider from "@/src/components/ToasterProvider"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  )
}
```

---

## Security Features

- ✅ JWT in `httpOnly` cookie — immune to XSS
- ✅ `secure` flag on in production
- ✅ `sameSite: lax` CSRF protection
- ✅ bcrypt password hashing (12 rounds)
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

- Next.js 14+ (App Router)
- Node.js 18+
- MongoDB database (local or Atlas)

---

## Bug Reports & Feature Requests

[Open an issue on GitHub](https://github.com/Gauravkumar512/nextauthforge/issues)

---

## License

MIT © [Gaurav Kumar](https://github.com/Gauravkumar512)

---

<p align="center">Built for the Next.js community 🚀</p>