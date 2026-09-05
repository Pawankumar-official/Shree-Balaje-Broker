# Milestone 1 — Foundation Notes

## Implemented interaction rules

- A new deal begins in `Matching`.
- The broker explicitly changes the Deal stage.
- Entering a Deal never creates transport, payments, offers or requirements automatically.
- The form allows transport/payment details to be unknown at creation time.

## Next build slice

Replace local sample data with persistent Party, Deal, Deal Trip and Payment records. The data model must support one Deal having zero or more transport trips and preserve all historical payment records.

## Deliberately not implemented yet

- Cloud database and authentication
- Offers, Requirements and matching
- Payment-entry ledger and commission ledger
- Cancellation flow
- Daily Register persistence/export
- Audit history, backup and production deployment
