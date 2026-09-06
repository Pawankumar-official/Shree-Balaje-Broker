# Production Readiness Gate — v0.1

**Status:** Not approved for real-business deployment yet.

## What is ready for a local pilot

- Party, Deal, trip, payment, commission, offer and requirement workflows.
- Cancellation history and separate financial ledgers.
- Daily/Monthly derived views, exports and print view.
- Responsive light/dark UI and browser-local persistence.

Use this only alongside the paper/WhatsApp workflow. It must not be the sole record of a real deal or payment while data is in browser local storage.

## Required before production launch

1. Create the Supabase project and apply both migrations in filename order.
2. Configure email/password authentication and provide project URL plus publishable key in `.env.local` and the deployment host.
3. Replace the local-storage adapter with the authenticated Supabase repository and test synchronization from two devices.
4. Allocate Deal serials server-side in a transaction; browser serial allocation is not cross-device safe.
5. Store money as integer paise/database decimals in the cloud path.
6. Implement and verify immutable audit events for Deal, trip, obligation, payment and cancellation changes.
7. Configure automated database backups and perform a documented restore test.
8. Set up a production domain/host, HTTPS, Supabase redirect URLs and a support/admin recovery procedure.
9. Run the realistic scenarios in the Master Product Specification alongside paper/WhatsApp for a pilot period.
10. Obtain business acceptance after comparing Daily Register and Monthly Ledger results against the paper records.

## Pre-launch test scenarios

- Normal full-settlement Deal.
- Truck entered after Deal creation; multiple trips on one Deal.
- Multiple partial payments in each ledger.
- Commodity and commission payment overdue.
- Cancelled Deal before delivery and after a partial payment.
- Same Party appearing as buyer on one Deal and seller on another.
- Cross-device simultaneous entry and refresh.
- Backup restoration into a non-production project.

## Deployment ownership required

The business owner must create or authorize the cloud database and hosting accounts. Do not share a Supabase secret/service-role key in chat or commit it to the repository. The browser application only uses a publishable key protected by Row Level Security.
