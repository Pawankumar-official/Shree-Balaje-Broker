# Business Workflow & Data Model — v1.0

**Status:** Design baseline for the next Milestone 1 implementation slice  
**Source:** Master Product Specification v1.0  
**Scope:** Core transaction records only; no cloud-provider decision is made here.

## 1. Workflow to implement next

1. Create or select a Party. A Party may be a buyer, seller, or both.
2. Create a Deal in `Matching`. Buyer, seller, commodity, quantity, rate, deal date and route are required. Transport and payment details are optional.
3. Add zero or more transport trips to the Deal. A trip records transporter, truck, route, freight, optional driver phone, and the relevant operational timestamps. A driver name is never stored.
4. The broker explicitly changes the Deal stage. The app may flag missing details, but must not change a stage automatically.
5. Record unlimited commodity, buyer-commission, and seller-commission payment entries. Entries are append-only in normal use. Outstanding balances are calculated from the Deal obligation less recorded payments.
6. Cancel rather than delete a Deal. Preserve the deal number, trips and payments; exclude its amounts from live financial totals.
7. Derive the Daily Register and later the Monthly Ledger from Deals, Trips and Payments. Do not maintain either as an independent editable transaction store.

## 2. Core record model

### Party

`id`, `name`, `roles`, `contactPerson`, `phone`, `alternatePhone`, `address`, `location`, `notes`, `trustLevel`, `riskFlags`, `createdAt`, `updatedAt`.

`roles` must allow both buyer and seller roles. Historical payment behaviour and deal history are derived, not manually duplicated.

### Deal

`id`, immutable `dealNumber`, `dealDate`, `dailySerial`, `monthlySerial`, `buyerPartyId`, `sellerPartyId`, `commodity`, `quantityQtl`, `ratePerQtl`, `route`, `stage`, `expectedCommodityPaymentDate`, `cancelledAt`, `cancelledReason`, `createdAt`, `updatedAt`.

The commodity obligation is derived as `quantityQtl × ratePerQtl`. The deal number and serials are allocated transactionally by the future database so two devices cannot receive the same number.

### Deal trip

`id`, `dealId`, `transporterId`, `truckId`, `route`, `quantityQtl`, `freightAmount`, `driverPhone`, `assignedAt`, `loadedAt`, `deliveredAt`, `notes`, `createdAt`, `updatedAt`.

One Deal can have zero or more trips. This supports a partial dispatch or multiple trucks without storing a single, lossy truck field on the Deal.

### Transporter and truck

Transporter: `id`, `name`, `phone`, `notes`, `reliability`, timestamps.  
Truck: `id`, `transporterId`, `registrationNumber`, `capacityQtl`, timestamps.

Freight history is queried from completed Deal Trips by **transporter + route**. It is not a separately editable memory table.

### Payment obligation and payment entry

A Deal has three potential ledgers: `commodity`, `buyerCommission`, `sellerCommission`.

An obligation defines the amount due and expected-payment date for each ledger. A Payment Entry has `id`, `dealId`, `ledgerType`, `amount`, `paymentDate`, `reference`, `note`, `recordedAt` and `recordedBy`.

Balance = obligation amount − sum of payment entries for that deal and ledger. Overdue means an expected-payment date is before today and the calculated balance is positive. Commission obligations must be entered explicitly; their amount must never be inferred from commodity payments.

## 3. Integrity rules

- Use money in integer paise (or database decimal) in persistence, never floating-point values.
- Quantities and rates must be greater than zero; payment amounts must be greater than zero.
- The buyer and seller must be valid Party records and may be the same Party only when that is an intentional, permitted business transaction.
- A cancelled Deal cannot accept new operational changes; historical payments and trips stay visible.
- Payment entries cannot be silently edited or deleted. Corrections require a reversal/adjustment record in the production system.
- Stage changes, cancellation and payment entries require timestamps and user identity once authentication is introduced.
- The UI must not treat a locally calculated serial as globally unique after cloud synchronization is introduced.

## 4. Current local prototype mapping

The existing browser-storage prototype has `Party`, `Deal`, `Payment`, `Transporter`, `Truck`, `Offer`, `Requirement` and `Todo` types. It proves the user flow, but it is not yet the production record model because:

- `Deal.truck` permits only one truck and should be replaced by Deal Trips.
- Commission entries have no corresponding commission obligation, so their outstanding balance cannot yet be calculated.
- Amounts are JavaScript numbers and browser localStorage is device-local.
- Local serial allocation is unsuitable for cross-device use.
- No authentication, audit trail, backup, migration or server-side validation exists.

## 5. Next implementation slice

Implement a persistence-ready domain layer before selecting the cloud backend:

1. Replace the single Deal truck field with a `DealTrip` model and derived freight history.
2. Add explicit per-ledger obligations and calculated balances/overdue status.
3. Centralize business-rule validation and calculations outside React components.
4. Add realistic automated tests for partial payment, overdue payment, later truck assignment, cancellation after payment, and multiple trips.
5. Keep the current local storage adapter only as a development adapter. Add a cloud adapter after the architecture decision.

## 6. Deferred decisions

- Cloud database, hosting and authentication provider.
- Official user-role model.
- Deal-number display format (the immutable database identifier is separate from display format).
- Monthly finalization snapshot schema.
- Accounting adjustment/reversal approval policy.
