# SKY TRACK Firestore Security Specification (Phase 0 — Payload-First TDD)

## 1. Data Invariants

1. **Global Default-Deny**: Every unspecified path in Firestore denies `read` and `write` by default.
2. **Admin Identity Enforcement**: Only the verified agency owners (`request.auth.token.email in ['infoskytracktravel@gmail.com', 'infoskytrack2008@gmail.com'] && request.auth.token.email_verified == true`) or a verified user whose UID exists in `/admins/{uid}` is treated as `isAdmin()`.
3. **PII Isolation (`bookings` & `paymentProofs`)**: Full customer booking documents (containing mobile, alternate phone, email, passenger details, UTR numbers) and customer-uploaded payment screenshots are strictly readable, listable, updatable, and deletable ONLY by `isAdmin()`.
4. **Zero Public Collection Scraping**: No collection permits public `list`. Customers tracking tickets use exact single-document `get` against `/ticketLookups/{mobile}` (exact 10-digit Indian mobile number) or `/ticketByRef/{referenceId}` (exact `ST-YYYYMMDD-XXXX` ID).
5. **Customer Submission Integrity**: Unauthenticated booking submissions (`create` on `/bookings/{bookingId}`) MUST set `status == 'Pending Verification'`, `hasTicketPdf == false`, `deliveryChannel in ['whatsapp', 'email']`, valid 10-digit mobile, bounded 1–6 passengers, exact server timestamps (`createdAt == request.time && updatedAt == request.time`), and strictly allowlisted keys (`hasAll` + `hasOnly`).
6. **Immutability & Temporal Integrity**: On any update, `createdAt`, `id`, and `referenceId` are immutable, and `updatedAt == request.time`.
7. **Admin Console Lock Protection**: `/adminConfig/{configId}` and `/admins/{uid}` cannot be read or modified by any public or non-admin user.
8. **Size & Resource Exhaustion Guards**: Every string field, array field, and document ID is strictly bounded by `.size()` and regex checks.

## 2. The "Dirty Dozen" Attack Payloads (Must All Return `PERMISSION_DENIED`)

1. **Public Scrape of Bookings (`list /bookings`)**: Unauthenticated or non-admin user tries to list all customer bookings to harvest phone numbers/emails.
2. **Public Get of Single Booking PII (`get /bookings/{id}`)**: Non-admin user tries to read another customer's full booking record.
3. **Shadow Field Injection on Booking Create (`create /bookings/{id}`)**: Attacker includes ghost field `isAdmin: true` or `paymentVerified: true` alongside valid fields.
4. **State Shortcutting on Booking Create (`create /bookings/{id}`)**: Customer attempts to submit a booking with `status: 'Ticket Issued'` and `hasTicketPdf: true` directly.
5. **Timestamp Forgery (`create /bookings/{id}`)**: Attacker sends a backdated client timestamp instead of `request.time` for `createdAt` or `updatedAt`.
6. **Oversized Passenger Array / DoW Attack (`create /bookings/{id}`)**: Attacker sends 50 passengers or a 500 KB `trainName` string to exhaust storage.
7. **ID Poisoning (`create /bookings/{badId}`)**: Attacker uses a 200-character or special-character document ID (`../admin`).
8. **Email Spoofing Attack (`list /bookings` with `email_verified: false`)**: Authenticated user with matching admin email string but `email_verified == false` tries to access admin endpoints.
9. **Public Ticket Injection (`create /ticketLookups/9820123456`)**: Non-admin tries to forge a fake confirmed ticket PDF entry under a customer's mobile number.
10. **Public Enumeration of Ticket Lookups (`list /ticketLookups`)**: Attacker tries to query/list all customer mobile numbers in `ticketLookups`.
11. **Public Read of Customer Payment Screenshot (`get /paymentProofs/{id}`)**: Non-admin tries to view another customer's UPI payment screenshot.
12. **Privilege Escalation (`create /admins/{attackerUid}` or `write /adminConfig/consoleLock`)**: Non-admin user tries to add themselves to `/admins` or overwrite the admin console password hash.
