# Security Specification — Maison Nour Storefront & Private Admin Dashboard

## 1. Data Invariants
1. **Default-Deny Safety Net**: Every unspecified path under `/databases/{database}/documents` rejects all reads and writes.
2. **Server-Enforced Admin Role (`isAdmin()`)**: Administrator privileges are verified exclusively on Firestore's backend via `request.auth.token.email_verified == true && (exists(/admins/$(uid)) || request.auth.token.email == 'alio1234599ol@gmail.com')`. Clients cannot grant themselves admin roles (`/admins` denies all list/create/update/delete writes), and unverified emails are always rejected.
3. **Strict Customer PII Isolation**: Customers can only `get` their own `/users/{userId}` document and `list` their own `/customerAddresses`, `/orders`, `/orderItems`, and `/orderTrackingHistory` (`resource.data.userId == request.auth.uid`). Listing `/users` is strictly restricted to `isAdmin()`.
4. **Catalog & Settings Integrity**: Public storefront browsing allows reading `/categories`, `/products`, `/productSizes`, `/productColors`, `/inventory`, and `/storeSettings/default`, while all writes (`create`, `update`, `delete`) require `isAdmin()`, except authenticated checkout batches decrementing `inventory.stockQty`.
5. **Order Immutability & Terminal Lock**: Orders enforce Cash on Delivery only (zero card numbers/CVVs permitted via `keys().hasOnly()`), strict arithmetic invariants (`totalAed == subtotalAed + deliveryFeeAed`), server timestamps (`request.time`), and terminal status protection once `Delivered` or `Cancelled`.
6. **Atomic Sub-Records**: `orderItems` and `orderTrackingHistory` require `existsAfter` / `exists` validation tied to the parent order.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Assigned Admin Privilege Escalation**: Non-admin user tries `setDoc(doc(db, 'admins', uid), { uid, email, createdAt })` -> `PERMISSION_DENIED`.
2. **Email Spoof with Unverified Token**: User with matching admin email string but `email_verified: false` tries to list `/users` or `/orders` -> `PERMISSION_DENIED`.
3. **Customer User Directory Scraping**: Authenticated customer attempts `getDocs(collection(db, 'users'))` -> `PERMISSION_DENIED`.
4. **Customer Cross-Account Order Enumeration**: Customer A queries `orders` with `where('userId', '==', customerB)` -> `PERMISSION_DENIED`.
5. **Customer Order Status Escalation**: Customer A tries to update their own order status from `Order Confirmed` to `Shipped` or `Delivered` -> `PERMISSION_DENIED`.
6. **Customer Product Creation Injection**: Customer A tries `setDoc(doc(db, 'products', 'hacked'), ...)` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection on User Profile**: User tries updating `/users/{uid}` with `{ role: 'admin', isVerified: true }` -> `PERMISSION_DENIED`.
8. **Invalid Payment Method / Card Storage**: Order payload injects `cardNumber` or `paymentMethod: 'Credit Card'` -> `PERMISSION_DENIED`.
9. **Terminal State Tampering**: Mutation attempts to change `Delivered` or `Cancelled` order back to `Processing` -> `PERMISSION_DENIED`.
10. **ID Poisoning / Resource Exhaustion**: Document ID > 128 chars or containing `/` / `$` -> `PERMISSION_DENIED`.
11. **Backdated Timestamp Spoofing**: Order or tracking event passes client `Date` instead of `request.time` -> `PERMISSION_DENIED`.
12. **Customer Store Settings Tampering**: Non-admin attempts to set `standardDeliveryFeeAed: 0` in `/storeSettings/default` -> `PERMISSION_DENIED`.
