# Security Specification - JMB MART

## Data Invariants
1. **User Identity**: Every user document must be owned by the authenticated user (`uid`). Roles are restricted and cannot be self-assigned to 'admin'.
2. **Order Integrity**: Orders must belong to a valid user. Document access is restricted to the creator (customer), assigned delivery partner, or administrator.
3. **Product & Marketing**: Products, Categories, and Banners are publicly visible but strictly managed by admins.
4. **Phone Security**: Each phone number can only be linked to one account.

## The "Dirty Dozen" Payloads (Denial Scenarios)
1. **Privilege Escalation**: User tries to set `role: 'admin'` in their profile.
2. **Identity Spoofing**: User tries to create an order with another user's `userId`.
3. **Unauthenticated Read**: Anonymous user tries to list all `users`.
4. **Update Gap**: Delivery person tries to change the `total` of an order.
5. **Orphaned Write**: User tries to create an order referencing a non-existent product ID.
6. **Shadow Update**: Admin tries to update a banner adding an unvalidated `isFeatured` field.
7. **Resource Poisoning**: User tries to use a 2MB string as a `landmark`.
8. **Auth Bypass**: User tries to update their profile while `isBlocked: true`.
9. **Relational Leak**: Delivery partner tries to see the full `user` document of a customer (PII leak).
10. **State Shortcut**: Delivery partner tries to skip 'assigned' and go straight to 'delivered'.
11. **Query Scrape**: Regular user tries to list all `orders` without a filter.
12. **OTP Hijack**: Delivery partner tries to update an order as 'delivered' without the correct `otp`.

## Audit Results
The current rules in `firestore.rules` are missing a default deny catch-all and rely too heavily on complex helper lookups for collection lists, which can trigger `permission-denied` if the query isn't perfectly aligned with the document-level logic. Specifically, the `users` list query in AdminDashboard is likely failing for non-admins and potentially even for admins if the document lookup in the rule is throttled.
