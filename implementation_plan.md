# Phase 1 Audit → Phase 2: Database Design

## Current State Assessment

### ❌ Phase 1 is NOT done

Here's what currently exists vs what Phase 1 requires:

| Feature | Required | Status |
|---|---|---|
| Login page | `/app/(auth)/login` | ❌ Missing |
| Signup page | `/app/(auth)/signup` | ❌ Missing |
| OAuth callback | `/app/(auth)/callback` | ❌ Missing |
| Logout | Server action | ❌ Missing |
| Dashboard | `/app/dashboard` | ❌ Missing |
| Profile page | `/app/settings` or `/app/profile` | ❌ Missing |
| Supabase auth client | `lib/supabase/` | ❌ Missing |
| Auth middleware | `middleware.ts` | ❌ Missing |
| Protected routes | via middleware | ❌ Missing |
| Google OAuth | Supabase OAuth flow | ❌ Missing |
| Email OTP | Supabase OTP | ❌ Missing |

### What IS there (basic boilerplate only)
- Next.js 16 + Supabase keys in `.env` ✅
- A basic chat UI with no auth (misplaced in `components/ui/chat/`) 
- Supabase packages installed (`@supabase/ssr`, `@supabase/supabase-js`) ✅

### Folder Structure Issues
- Chat components are in `components/ui/chat/` (wrong — should be `components/chat/`)
- No `(auth)` route group exists
- No `lib/supabase/` directory
- `lib/utils.ts` contains a `Message` type (should be in `types/`)
- Missing `actions/`, `types/`, `hooks/` folders

---

## Proposed Changes

### 1. Fix Folder Structure

Move existing chat files to the correct locations per the roadmap.

#### [MODIFY] Folder restructure
- Move `components/ui/chat/*.tsx` → `components/chat/`
- Move `Message` type from `lib/utils.ts` → `types/index.ts`
- Create `lib/supabase/`, `actions/`, `types/`, `hooks/` directories

---

### 2. Supabase Auth Clients

#### [NEW] `lib/supabase/client.ts`
Browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`.

#### [NEW] `lib/supabase/server.ts`
Server-side Supabase client using `createServerClient` from `@supabase/ssr` with Next.js `cookies()`.

#### [NEW] `lib/supabase/middleware.ts`
Supabase session refresher for middleware usage.

---

### 3. Middleware (Protected Routes)

#### [NEW] `middleware.ts` (root)
- Refresh Supabase session on every request
- Redirect unauthenticated users from protected routes (`/dashboard`, `/chat`, `/agents`, `/settings`) to `/login`
- Redirect authenticated users away from `/login`, `/signup` to `/dashboard`

---

### 4. Auth Pages

#### [NEW] `app/(auth)/layout.tsx`
Clean centered layout for auth pages with a branded background.

#### [NEW] `app/(auth)/login/page.tsx`
- Email OTP login (magic link via Supabase)
- Google OAuth button
- Premium dark glassmorphism design

#### [NEW] `app/(auth)/signup/page.tsx`
- Email signup form
- Google OAuth button

#### [NEW] `app/(auth)/callback/route.ts`
Handles OAuth & OTP redirect — exchanges `code` for session using `exchangeCodeForSession`.

---

### 5. Server Actions

#### [NEW] `actions/auth.ts`
- `signInWithEmail(formData)` — sends OTP magic link
- `signInWithGoogle()` — initiates Google OAuth flow  
- `signOut()` — clears Supabase session and redirects to `/login`

---

### 6. Dashboard & Profile

#### [NEW] `app/dashboard/page.tsx`
Server Component that fetches the current user from Supabase session. Displays a welcome card.

#### [NEW] `app/settings/page.tsx`
Shows user's profile: avatar, name, email (read from Supabase `auth.user`).

---

### 7. Landing Page Update

#### [MODIFY] `app/page.tsx`
Update the home page to redirect authenticated users to `/dashboard` or show Login/Signup CTAs for guests.

---

### 8. Types

#### [NEW] `types/index.ts`
Move `Message` type here plus add `User` and `Profile` types.

---

## Open Questions

> [!IMPORTANT]
> **Google OAuth Setup**: Have you enabled Google as an OAuth provider in your Supabase project dashboard? Go to **Authentication → Providers → Google** and add your Google Client ID + Secret. This is needed for Phase 1 Google OAuth to work.

> [!IMPORTANT]
> **Email OTP vs Email+Password**: The plan uses **Email OTP (magic link)** as primary login (Supabase sends a link/code to your email). Do you want Email+Password signup too, or just OTP + Google?

> [!NOTE]
> **Supabase Dashboard SQL**: Phase 2 database tables will be created via SQL in the Supabase Dashboard. You'll need access to the SQL Editor there.

---

## Verification Plan

### Automated Checks
- `pnpm run build` — TypeScript type check passes with no errors

### Manual Verification
1. Visit `/login` → see a premium styled login page
2. Click "Continue with Google" → redirects to Google OAuth → comes back → lands on `/dashboard`
3. Enter email → receive magic link → click link → land on `/dashboard`
4. Visit `/dashboard` while logged out → redirected to `/login`
5. Click logout → session cleared → redirected to `/login`
6. Visit `/settings` → see your profile info
