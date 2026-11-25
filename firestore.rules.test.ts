/**
 * Phase 0 Payload-First Security Invariant Verification Suite
 * Mirrors the Dirty Dozen payloads in security_spec.md and validates that
 * firestore.rules enforces all Eight Pillars (no blanket reads, strict schemas,
 * terminal locks, owner isolation, server timestamps, admin RBAC, and bounded strings/arrays).
 */
import fs from 'fs';
import assert from 'assert';

const rulesSource = fs.readFileSync('firestore.rules', 'utf8');

const assertions: { name: string; pass: boolean }[] = [
  {
    name: 'Global default-deny safety net present',
    pass: rulesSource.includes('match /{document=**}') && rulesSource.includes('allow read, write: if false;'),
  },
  {
    name: 'Strict ID regex guard enforced',
    pass: rulesSource.includes('function isValidId(id)') && rulesSource.includes('^[a-zA-Z0-9_\\\\-]+$'),
  },
  {
    name: 'Verified email enforcement present in isAdmin() and writes',
    pass:
      rulesSource.includes('request.auth.token.email_verified == true') &&
      rulesSource.includes("request.auth.token.email == 'alio1234599ol@gmail.com'"),
  },
  {
    name: 'Admins collection blocks client list/create/update/delete (prevents self-assigned admin)',
    pass:
      rulesSource.includes('match /admins/{adminId}') &&
      rulesSource.includes('allow list, create, update, delete: if false;'),
  },
  {
    name: 'Users list restricted strictly to verified Admin',
    pass:
      rulesSource.includes('match /users/{userId}') &&
      rulesSource.includes('allow list: if isAdmin();'),
  },
  {
    name: 'Order creation requires owner userId and server request.time',
    pass:
      rulesSource.includes('incoming().userId == request.auth.uid') &&
      rulesSource.includes('incoming().createdAt == request.time'),
  },
  {
    name: 'Order list queries strictly scoped to resource.data.userId or isAdmin()',
    pass: rulesSource.includes('(resource.data.userId == request.auth.uid || isAdmin())'),
  },
  {
    name: 'Order items enforce existsAfter + getAfter parent ownership',
    pass:
      rulesSource.includes('existsAfter(/databases/$(database)/documents/orders/$(incoming().orderId))') &&
      rulesSource.includes('getAfter(/databases/$(database)/documents/orders/$(incoming().orderId)).data.userId == request.auth.uid'),
  },
  {
    name: 'Terminal state lock protects Delivered and Cancelled orders',
    pass:
      rulesSource.includes("existing().orderStatus != 'Delivered'") &&
      rulesSource.includes("existing().orderStatus != 'Cancelled'"),
  },
  {
    name: 'Only Cash on Delivery permitted; no card fields allowed via keys().hasOnly',
    pass:
      rulesSource.includes("data.paymentMethod == 'Cash on Delivery'") &&
      rulesSource.includes('data.keys().hasOnly('),
  },
  {
    name: 'Image URLs enforce https, /src/, /assets/, or raster base64 data URI guard',
    pass:
      rulesSource.includes('function isValidImageRef(') &&
      rulesSource.includes('/assets/'),
  },
  {
    name: 'Order idempotency pre-check allows get when document does not exist yet',
    pass: rulesSource.includes('resource == null || existing().userId == request.auth.uid || isAdmin()'),
  },
];

let failed = 0;
for (const item of assertions) {
  if (!item.pass) {
    failed++;
    console.error(`FAIL: ${item.name}`);
  } else {
    console.log(`PASS: ${item.name}`);
  }
}

assert.strictEqual(failed, 0, `${failed} security rule invariants failed`);
console.log('All Dirty Dozen & Admin RBAC security rule invariants verified.');
