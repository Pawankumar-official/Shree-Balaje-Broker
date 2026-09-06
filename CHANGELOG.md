# Changelog

## 0.1.0 — 06 September 2026

### Added

- React and TypeScript web application foundation.
- Responsive Black + Gold dashboard focused on today's business.
- Local sample records for deal lifecycle, transport visibility, payment attention and the Daily Register.
- One-screen quick-entry Deal form. It creates a deal in `Matching` without automatically creating a truck, payment, offer or requirement.
- Explicit user-controlled Deal stage updates.

### Scope

This is a local interface foundation only. It does not yet have authentication, cloud persistence, payments, exports, or production-grade audit/recovery capabilities.

### Tested

- TypeScript production build.
- Responsive layout review at desktop and mobile widths.

### Status

In progress — Milestone 1 interface foundation.

## Unreleased

### Added

- Business Workflow & Data Model v1.0 design baseline for the next Milestone 1 slice.
- Party business-history profiles and manual Offer / Requirement entry.
- Deal workspace actions for transport trips and commodity payments.
- Cancellation safeguards: a cancellation reason is required; historical trips and payments remain visible; cancelled Deals cannot receive new trips, payments, or stage changes.
- Separate commodity, buyer commission, and seller commission ledgers with independent obligations, partial payments and calculated outstanding balances.
- Transporter and Truck entry, with driver-phone-only records and derived transporter + route freight history.
- Daily Register CSV export, print-ready Monthly Ledger totals, and simple To-Do entry.
- Controlled Deal editing and a Reports / Exports workspace for Deal, payment, freight and accounting records.
- Offers and Requirements can be converted through a reviewed, prefilled Deal flow or marked Open, Converted, or Closed.
- Payment due list with ledger, Deal, parties, due date and overdue indication; payment-entry corrections; clickable Deal-status progression; saved light/dark mode preference.

### Changed

- Daily deal display numbering resets each business day: `1, 2, 3…`.
- Monthly accounting serials continue through the month, independent of the daily display number.
- New deals are appended after the existing daily records.
