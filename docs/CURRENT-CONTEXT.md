# Shree Balaje Brokerage — Current Context & V2 Roadmap

> **Living handoff doc for AI sessions.** Updated at the end of every branch/change. A future session should read this FIRST to get full context without digging through raw `.jsonl` session logs.

## What this app is
A real-world **Bihar grain brokerage** deal-management web app. Manages the full lifecycle of brokerage Deals, parties, transport trips, payments/commissions, offers & requirements, and Daily/Monthly registers. Runs alongside the paper/WhatsApp workflow during pilot.

- **Live:** https://shree-balaje-broker.vercel.app
- **Repo:** https://github.com/Pawankumar-official/Shree-Balaje-Broker.git (branch `master`)
- **Stack:** React 19 · Vite 8 · TypeScript · Supabase (Supabase JS 2.x)
- **Scripts:** `npm run dev` (Vite :5173) · `npm run build` (`tsc -b && vite build`) · `npm run lint` (oxlint) · `npm run preview`
- **Node:** v24 / npm 11.

## Git / deploy workflow (MANDATED by the owner — always follow)
Protects the live Vercel app. For every change:
1. New feature branch from updated `master` (e.g. `feature/<name>`).
2. Implement + verify local (`dev`, `build`, `lint`).
3. Push branch → open PR to `master` → **Vercel Preview** URL.
4. Owner reviews the preview, then merges to `master` → Vercel auto-deploys.
Never push directly to `master`. No `gh`/`vercel` CLI installed on this machine; PRs are opened via the GitHub pull/new link the owner merges manually.

## Security & integrity rules (MUST NOT violate)
- Never commit `.env.local`, service-role/secret keys, or real business data. Browser uses only the **publishable** key; RLS guards rows.
- **Payments are append-only.** Corrections require a reversal/adjustment record, never silent edit/delete.
- **Driver name is never stored** — phone only (`deal_trips.driver_phone`, `trucks.driver_phone`).
- Money is stored as **integer paise** in the DB (`paise()`/`rupees()` converters); never floats.
- **Cancelled Deals are immutable** — history retained, new operations blocked, excluded from totals.
- Do not delete or silently overwrite historical transactions; cancellation > deletion. Party deletion fails if it has Deals/offers/requirements.
- Quantities/rates/payments must be > 0. Off the record: local client-side serials are not globally unique after cloud sync; only cloud `create_deal` RPC is safe.

## How the app works
- **Cloud mode** is active (`.env.local` has a configured Supabase project). Data loads/saves through `src/cloud-storage.ts` (Supabase) behind an AuthGate. A local `src/storage.ts` (localStorage) adapter exists but is not the runtime default.
- UI is a **single-page shell** in `src/App.tsx` (`App.tsx` has all screens + modal forms; `App.css` the design system; `src/domain.ts` types + pure helpers; `src/AuthGate.tsx` auth screen; `src/index.css` global + auth styles).
- Design language: gold (`#b58b36`) + charcoal (`#161511`) "premium brokerage" look, Georgia serif headings, light/dark + mobile responsive.

## Feature inventory (current master)
Dashboard · Deals (workspace: stage, edit, commission, payment, cancel, trips) · Parties (profile + deal history) · Offers & Requirements (commodity match → prefilled Deal) · Transport (transporters, trucks, freight history) · Payments & Commissions (3 ledgers, due + overdue, recorded entries) · Daily Register (export CSV) · Monthly Ledger (print/PDF) · To-Do · Reports. Auth sign-in / sign-up with split-hero premium UI.

## Data model (Supabase tables)
`profiles`, `parties` (+`trust` enum, `risk_flags`), `transporters` (+`routes`, `reliability`), `trucks` (+`driver_phone` since Phase 2, `capacity_qtl`), `deals` (server-side `create_deal` RPC allocates serials), `deal_trips`, `payment_obligations` (ledger: commodity / buyer_commission / seller_commission), `payment_entries` (append-only), `offers`, `requirements`, `todos`, `audit_events` (+ `audit_business_change` trigger — written but **no UI reads it yet**), `monthly_ledger_snapshots` (+ `finalize_monthly_ledger` RPC — created but **never called from UI**).

## V2 Roadmap (improvement program — reserve the "progress" language for this)
- ✅ **Done — Login page premium redesign** (split hero + responsive + show/hide password, loading state, autocomplete, status styling). Branch `feature/login-premium` → PR #2 → live.
- 🔨 **In progress — Phase 2 Foundation**: this `feature/foundation` branch.
  - ✅ `docs/CURRENT-CONTEXT.md` (this file)
  - Sidebar footer reflects real cloud/local mode (`App.tsx`)
  - A11y: Escape-to-close modals, `aria-label`s on icon-only buttons, visible focus states
  - Empty-state consistency
  - Party `trust` editable + Edit-Party flow
  - Transport cloud fix: read transporter `routes` from `notes`; add `trucks.driver_phone` (migration) + wire save/read — **owner must apply the new migration**
  - Fix Dashboard active/overdue inconsistency around Closed deals
- ⏳ **Phase 3 — Audit / Activity timeline** (use existing `audit_events` table): Activity page + per-deal/per-party history.
- ⏳ **Phase 4 — Payments reversal/adjustment flow** (append-only corrections).
- ⏳ **Phase 5 — Page-by-page UX polish** (Dashboard KPIs, Deal workspace, Offers match, Reports/Monthly finalization via existing RPC).
- ⏳ **Phase 6 — Deep design-system overhaul** (tokens, typography, badges, full dark coverage).

## Change Log (append after each merged branch)
- **2026-09-11 · feature/login-premium · PR #2** — Premium responsive split-hero sign-in: brand panel + form on desktop, single card on mobile; show/hide password, autocomplete, submit loading state, gold/red/green status messages, focus rings. Consolidated auth styles into `index.css`. **LIVE on production.**
- **2026-09-11 · feature/foundation** — (in progress) handoff doc, cloud-mode sidebar label, Escape-to-close + aria-labels, empty-state consistency, Edit-Party + trust, transport cloud fix (+ `trucks.driver_phone` migration), active/overdue consistency.