# Save My Wallet — Web

A personal finance management front-end built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS 4**. It connects to the [Save My Wallet API](/) backend to help you track expenses, credit cards, monthly payment projections, and spending limits — all from one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

---

## Table of Contents

- [Save My Wallet — Web](#save-my-wallet--web)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Authentication](#authentication)
    - [Dashboard](#dashboard)
    - [Expenses](#expenses)
    - [Credit Cards](#credit-cards)
    - [Monthly Projection](#monthly-projection)
    - [Settings](#settings)
    - [General UX](#general-ux)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Environment Variables](#environment-variables)
    - [Installation](#installation)
    - [Running in Development](#running-in-development)
  - [Available Scripts](#available-scripts)
  - [Project Structure](#project-structure)
  - [API Endpoints](#api-endpoints)

---

## Features

### Authentication

- **Login & Register** pages with form validation, password visibility toggle, and inline error handling.
- **JWT token management** with automatic access-token refresh. Concurrent requests are queued during token renewal.
- **Auth guard** that protects all routes — unauthenticated users are redirected to `/login`; authenticated users landing on `/login`, `/register`, or `/` are redirected to `/dashboard`.
- Tokens and session state are persisted in `localStorage`.

### Dashboard

- Personalized welcome greeting.
- **5 animated KPI cards** (Framer Motion):
  - Pending purchases count
  - Active subscriptions count
  - Total pending balance (ARS currency)
  - Next credit card closing date (with days remaining)
  - Next credit card expiration date (with days remaining)
- **Credit cards section** — responsive grid displaying each card's alias, status, expense count, closing/expiration dates, estimated payment, and available limit. Edit and delete actions per card.
- **Projection chart** — stacked bar chart (Recharts) showing purchases vs. subscriptions per month for the next 12 months with a reference line for the user's monthly spending limit. Bars exceeding the limit are highlighted.

### Expenses

- **Full expense list** with:
  - Text search (accent-insensitive, case-insensitive)
  - Status filter (`active`, `pending`, `finished`, `cancelled`)
  - Type filter (`purchase`, `subscription`)
  - Sortable columns (title, credit card, amount, installments, status, type)
  - Client-side pagination (10 / 25 / 50 / 100 per page)
- **Bulk selection & delete** — select individual rows or all, then bulk-delete with a confirmation dialog. Processes sequentially and reports partial failures.
- **Create / Edit expense** — form with smart first-payment-date calculation based on credit card closing date, category selection, installment count, and one-time payment toggle.
- **Expense detail** — shows full expense info and a list of payments with:
  - Quick status advance (click badge: unconfirmed → confirmed → paid)
  - Full status dropdown for any status
  - Edit amount and date via modal
  - Create / delete payments (subscriptions only)

### Credit Cards

- **Create / Edit credit cards** with fields for alias, limit, financing limit, next closing date, next expiration date, and optional parent (main) card.
- When a parent card is selected, limits and dates are auto-filled.
- Unsaved-changes detection with a confirmation dialog on cancel.

### Monthly Projection

- **Period list** — accordion-style view of monthly payment periods (12 months ahead + any older open periods).
- **URL-driven state** — opening a period sets `?period=MM/YYYY` in the URL (shareable, works with browser back/forward).
- **Auto-scroll** to the opened period.
- **Show / Hide finished periods** toggle, persisted in `localStorage`.
- **Refresh** all periods or refresh an individual period.
- **Color-coded period headers** by status: pending (amber), current (blue), finished (emerald).

Each period includes:

- **Summary header** — totals for amount, confirmed, paid, and pending; payment completion count.
- **Per-account breakdown** — spending totals grouped by main credit card.
- **Comprehensive filtering** — text search, multi-select status filter, multi-select account filter, type filter.
- **Bulk actions** — select payments and change status in bulk, with quick-advance buttons (Confirmed / Paid). Partial failures are shown in a detailed error modal.
- **Individual payment actions** — same as the expense detail page (edit amount, edit date, quick status, full status dropdown, view expense, create/delete for subscriptions).
- **Visual payment differentiation** — color gradients per type: single payment, last installment, first installment, subscription, simulated.
- **Optimistic cache updates** — local period totals are recalculated immediately after mutations instead of waiting for a refetch.

### Settings

- **Tabbed interface** (Profile | Categories) with animated transitions.
- **Profile** — edit username, email, password, first/last name, birthdate, and monthly spending limit. Only modified fields are sent.
- **Expense Categories** — full CRUD for categories, separated into Expense and Income sections. Inline add/edit forms, delete with confirmation, alphabetical ordering.

### General UX

- **Dark / Light theme** toggle persisted in `localStorage` (dark by default).
- **Responsive sidebar** — full sidebar on desktop, hamburger menu with overlay on mobile.
- **Toast notifications** for success and error feedback.
- **Animated transitions** throughout (Framer Motion).
- **Accessible dialogs & dropdowns** via Radix UI primitives.
- **ARS currency formatting** (`$1.234,56`) across the entire app.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Server State | [TanStack React Query 5](https://tanstack.com/query) |
| HTTP Client | [Axios](https://axios-http.com/) |
| Charts | [Recharts](https://recharts.org/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| UI Primitives | [Radix UI](https://www.radix-ui.com/) (Dialog, AlertDialog, DropdownMenu) |
| Icons | [Lucide React](https://lucide.dev/) |
| Notifications | [react-hot-toast](https://react-hot-toast.com/) |
| Fonts | Geist Sans & Geist Mono |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A running instance of the **Save My Wallet API** backend (the app is a front-end only — it requires the REST API to function)

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Save My Wallet API | `http://localhost:8000` |

> If you have a `.env.production` file for a remote API, you can use the `dev:prod` script to load it during development (see [Available Scripts](#available-scripts)).

### Installation

```bash
git clone <repository-url>
cd smw-web
npm install
```

### Running in Development

1. **Make sure the backend API is running** at the URL specified in `NEXT_PUBLIC_API_BASE_URL`.

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Register a new account or log in with existing credentials. You will be redirected to the dashboard.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start the development server |
| `dev:prod` | `dotenv -e .env.production -- next dev --turbopack` | Start dev server loading `.env.production` variables (requires `dotenv-cli`) |
| `build` | `next build` | Build the app for production |
| `start` | `next start` | Start the production server |
| `lint` | `eslint` | Run ESLint |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── dashboard/                # Dashboard with KPIs, cards & chart
│   ├── expenses/                 # Expense list, detail, create, edit
│   ├── credit-cards/             # Credit card create & edit
│   ├── projection/               # Monthly projection periods
│   ├── profile/                  # User profile page
│   └── settings/                 # Settings (profile + categories tabs)
├── components/                   # Shared UI components
│   ├── AuthGuard.tsx             # Route protection
│   ├── ConfirmDialog.tsx         # Reusable confirmation dialog
│   ├── SidebarLayout.tsx         # App shell with sidebar navigation
│   ├── ProjectionChart.tsx       # Stacked bar chart
│   ├── ThemeToggle.tsx           # Dark/light mode switch
│   └── ...
├── features/                     # Feature-based modules
│   ├── auth/hooks/               # Login, register, update user hooks
│   ├── dashboard/                # Credit card form & hooks
│   ├── expenses/                 # Expense form, hooks & utilities
│   ├── projection/               # Period detail, edit modal, hooks
│   └── settings/                 # Profile & categories settings
├── lib/
│   ├── api/                      # Axios API client & endpoint functions
│   ├── models/                   # TypeScript interfaces
│   ├── parsers/                  # snake_case ↔ camelCase transformers
│   └── utils/                    # Date formatting & helpers
└── providers/                    # React context providers
    ├── AuthProvider.tsx           # Authentication state
    ├── QueryProvider.tsx          # TanStack React Query
    └── ThemeProvider.tsx          # Theme state
```

---

## API Endpoints

The app consumes the following REST API endpoints (all under the base URL):

| Area | Method | Endpoint |
|------|--------|----------|
| Auth | `POST` | `/api/v3/auth/login` |
| Auth | `POST` | `/api/v3/auth/register` |
| Users | `GET` | `/api/v3/users/me` |
| Users | `PUT` | `/api/v3/users/{id}` |
| Credit Cards | `GET` | `/api/v3/credit-cards` |
| Credit Cards | `GET` | `/api/v3/credit-cards/{id}` |
| Credit Cards | `POST` | `/api/v3/credit-cards` |
| Credit Cards | `PUT` | `/api/v3/credit-cards/{id}` |
| Credit Cards | `DELETE` | `/api/v3/credit-cards/{id}` |
| Purchases | `GET` `POST` `PUT` `DELETE` | `/api/v3/purchases[/{id}]` |
| Subscriptions | `GET` `POST` `PUT` `DELETE` | `/api/v3/subscriptions[/{id}]` |
| Expenses | `GET` | `/api/v3/expenses` |
| Payments | `PUT` | `/api/v3/expenses/payments/{id}` |
| Subscription Payments | `POST` | `/api/v3/subscriptions/{id}/payments` |
| Subscription Payments | `DELETE` | `/api/v3/subscriptions/{id}/payments/{paymentId}` |
| Periods | `GET` | `/api/v3/periods/projection` |
| Periods | `GET` | `/api/v3/periods/{month}/{year}` |
| Categories | `GET` `POST` `PUT` `DELETE` | `/api/v3/expense-categories[/{id}]` |
