# AI Agent Guidelines — Save My Wallet Web

This document provides context, conventions, and instructions for any AI coding agent (GitHub Copilot, Cursor, Cline, etc.) working on this project.

---

## ⚠️ Language Policy

> **All code, comments, commit messages, documentation, variable names, type names, and JSDoc annotations MUST be written in English** unless the user explicitly instructs otherwise.
>
> User-facing UI strings (labels, placeholders, toasts) should also default to English unless told otherwise.

---

## Project Overview

**Save My Wallet Web** is a personal finance management front-end. It is a **client-only** Next.js application that consumes a separate REST API backend (`Save My Wallet API`). There is **no server-side business logic** in this repo — all data comes from API calls.

Refer to the [README.md](README.md) for a complete feature list and setup instructions.

---

## Tech Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16 | App Router (`src/app/`), React Compiler enabled |
| React | 19 | Hooks only, no class components |
| TypeScript | 5 | Strict mode enabled |
| Tailwind CSS | 4 | PostCSS plugin (`@tailwindcss/postcss`), no `tailwind.config.js` |
| TanStack React Query | 5 | Server-state management, caching, mutations |
| Axios | latest | HTTP client with interceptors for auth |
| Framer Motion | 12 | Animations and transitions |
| Recharts | 3 | Charts (dashboard projection) |
| Radix UI | latest | Accessible primitives (Dialog, AlertDialog, DropdownMenu) |
| Lucide React | latest | Icon library |
| react-hot-toast | 2 | Toast notifications |

---

## Architecture & Conventions

### Directory Structure

```
src/
├── app/                # Next.js App Router — pages and layouts only
├── components/         # Shared, reusable UI components
├── features/           # Feature-based modules (components, hooks, utils)
│   ├── auth/
│   ├── dashboard/
│   ├── expenses/
│   ├── projection/
│   └── settings/
├── lib/
│   ├── api/            # Axios client and endpoint functions
│   ├── models/         # TypeScript interfaces (camelCase)
│   ├── parsers/        # snake_case (API) ↔ camelCase (frontend) transformers
│   └── utils/          # Pure utility functions
└── providers/          # React context providers (Auth, Query, Theme)
```

### Key Architectural Rules

1. **Pages are thin.** Route files (`page.tsx`) should contain minimal logic — delegate to feature components and hooks.

2. **Feature-based organization.** Each domain area (`auth`, `dashboard`, `expenses`, `projection`, `settings`) has its own folder under `src/features/` containing `components/`, `hooks/`, and optionally `utils/`.

3. **Parser layer is mandatory.** The API returns snake_case JSON. All API responses **must** pass through a parser in `src/lib/parsers/` before reaching the UI. Models in `src/lib/models/` use camelCase.

4. **API functions go in `src/lib/api/`.** Each file corresponds to one domain area. All functions use the shared `apiClient` from `client.ts` (which handles auth tokens and refresh automatically).

5. **React Query for all server state.** Use `useQuery` for reads and `useMutation` (or manual `queryClient.setQueryData`) for writes. Cache keys follow the pattern `["resource-name", ...params]` (e.g., `["periods", 12]`, `["expenses"]`).

6. **Optimistic cache updates** are preferred over refetching when modifying individual items within a list (e.g., updating a payment status inside a period). Use `queryClient.setQueryData` with a recalculation helper when needed.

7. **No server-side logic.** This is a client-rendered SPA wrapped in Next.js. Do not add API routes, server actions, or server components with data fetching. All pages use `"use client"`.

### Coding Style

- **Functional components only.** No class components.
- **Named exports for components, default exports for pages.** Page files (`page.tsx`) use `export default function`.
- **Hooks use the `use` prefix.** Custom hooks are placed in the relevant `features/*/hooks/` folder.
- **TypeScript strict mode.** No `any` types unless absolutely unavoidable (and documented with a comment explaining why).
- **Interfaces over types** for object shapes. Use `type` for unions, intersections, and mapped types.
- **Avoid inline styles.** Use Tailwind CSS utility classes exclusively.
- **No CSS modules or styled-components.**

### Tailwind CSS 4 Notes

- Tailwind 4 uses the PostCSS plugin (`@tailwindcss/postcss`). There is **no** `tailwind.config.js` — configuration is done via CSS (`globals.css`) using `@theme` directives.
- Use Tailwind's utility-first approach. Custom values (colors, spacing) should be added via the `@theme` block in `globals.css` rather than arbitrary values.
- Dark mode uses the `dark` class on `<html>`, toggled by `ThemeProvider`.

### Component Patterns

- **Confirmation dialogs:** Use the shared `ConfirmDialog` component (`src/components/ConfirmDialog.tsx`), which wraps Radix `AlertDialog`.
- **Modals / Dialogs:** Use Radix `Dialog` with Framer Motion animations.
- **Dropdowns:** Use Radix `DropdownMenu` (portal-based to avoid overflow clipping).
- **Toast notifications:** Use `react-hot-toast` — `toast.success()` / `toast.error()`.
- **Animations:** Framer Motion `motion.div` with `AnimatePresence` for enter/exit transitions.
- **Icons:** Import from `lucide-react`. Use `className="h-4 w-4"` (or `h-5 w-5`) for consistent sizing.

### State Management

| State Type | Solution |
|-----------|----------|
| Server/async state | TanStack React Query |
| Auth state | `AuthProvider` context (`src/providers/AuthProvider.tsx`) |
| Theme | `ThemeProvider` context (`src/providers/ThemeProvider.tsx`) |
| Local UI state | `useState` / `useReducer` |
| URL state | `useSearchParams` from `next/navigation` |
| Persisted preferences | `localStorage` (e.g., `projection.showFinished`, `theme`) |

### Currency & Locale

- All monetary values are formatted as **ARS** using `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })`.
- Amount inputs use `type="number"` with `step="0.01"`.

---

## API Integration

### Base URL

Configured via `NEXT_PUBLIC_API_BASE_URL` environment variable (default: `http://localhost:8000`).

### Authentication Flow

1. Login/Register returns `accessToken` + `refreshToken`, stored in `localStorage` under `smw:tokens`.
2. The Axios request interceptor attaches `Authorization: Bearer <accessToken>` to every request.
3. On `401`, the response interceptor attempts a token refresh using the `refreshToken`. Concurrent requests are queued and replayed after refresh.
4. A custom DOM event `tokenRefreshed` is dispatched to sync the `AuthProvider`.

### Adding a New API Endpoint

1. Define the raw API response type (snake_case) in `src/lib/api/<domain>.ts`.
2. Create a parser function in `src/lib/parsers/<domain>.ts` that maps to the camelCase model.
3. Define the camelCase model interface in `src/lib/models/<domain>.ts`.
4. Create a hook in `src/features/<domain>/hooks/` using React Query.

---

## Common Tasks

### Adding a New Page

1. Create `src/app/<route>/page.tsx` with `"use client"` directive.
2. Wrap content in `<SidebarLayout>`.
3. Add the route to the sidebar navigation in `src/components/SidebarLayout.tsx` if it should appear in the nav.
4. Page should delegate to feature components and hooks.

### Adding a New Feature Module

1. Create folder `src/features/<name>/`.
2. Add subfolders as needed: `components/`, `hooks/`, `utils/`.
3. Create hooks that wrap React Query calls to API functions.
4. Create components that consume those hooks.

### Modifying the Projection Cache

When updating payment data in `PeriodDetail`, always use the `recalcPeriodTotals` helper to recalculate the period's aggregate fields (`totalAmount`, `totalConfirmedAmount`, `totalPaidAmount`, `totalPendingAmount`, `totalPayments`, `completedPaymentsCount`, `pendingPaymentsCount`, `status`). Do **not** manually set individual total fields.

---

## Testing & Quality

- **Linting:** `npm run lint` — runs ESLint with `eslint-config-next` (core-web-vitals + TypeScript rules).
- **Type checking:** `npx tsc --noEmit` — validates TypeScript types.
- **No test framework is currently configured.** If adding tests, prefer Vitest + React Testing Library.

---

## Environment & Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server (connects to `.env.local` API) |
| `npm run dev:prod` | Development server loading `.env.production` (requires `dotenv-cli`) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

---

## Do's and Don'ts

### Do

- ✅ Write all code, comments, and docs in **English**
- ✅ Use the parser layer for all API data transformations
- ✅ Use React Query for all server-state (no `useEffect` + `fetch` patterns)
- ✅ Use Radix UI primitives for dialogs, dropdowns, and other overlays
- ✅ Use Tailwind utility classes for all styling
- ✅ Use `toast.success()` / `toast.error()` for user feedback
- ✅ Keep page files thin — extract logic into feature hooks and components
- ✅ Use `"use client"` directive on all page and component files
- ✅ Prefer optimistic cache updates for single-item mutations in lists
- ✅ Use `ConfirmDialog` for any destructive action

### Don't

- ❌ Write code or comments in any language other than English (unless explicitly asked)
- ❌ Add API routes or server actions — this is a client-only app
- ❌ Use `any` type without a justifying comment
- ❌ Use inline styles or CSS modules
- ❌ Use `useEffect` for data fetching — use React Query hooks instead
- ❌ Bypass the parser layer by using API response shapes directly in components
- ❌ Add new dependencies without considering existing ones (e.g., don't add another icon library when Lucide is already used)
- ❌ Create `tailwind.config.js` — Tailwind 4 is configured via CSS
- ❌ Use class components or HOCs
