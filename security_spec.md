# IDEA Marketplace — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Strict PII Isolation:** `/users/{userId}` stores customer PII (`email`, `phone`). Only the verified owner (`request.auth.uid == userId`) or a verified Admin may `get` a document. Collection-wide `list` is strictly limited to Admin (non-admins cannot scrape customer emails).
2. **No Self-Assigned Privileges:** On create, `role` MUST equal `'customer'`. Users cannot create documents in `/admins/{adminId}` and cannot modify `role`, `uid`, `provider`, or `createdAt` during update.
3. **Verified Identity Required:** All standard writes require `request.auth != null && request.auth.token.email_verified == true`.
4. **Strict Keys & Volumetric Bounds:** Every string enforces explicit `maxLength` matching `firebase-blueprint.json`. Unknown/ghost keys are rejected via `hasAll` + `hasOnly` (on create) and `affectedKeys().hasOnly(...)` (on update).
5. **Temporal Integrity:** `createdAt` MUST equal `request.time` on create and remain immutable on update; `updatedAt` MUST equal `request.time` on both create and update.
6. **Path Variable Hardening:** `{userId}` and `{adminId}` MUST pass `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, `size <= 128`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Identity Spoofing:** User `uidA` creates `/users/uidA` with `{ "uid": "uidB", ... }`.
2. **Cross-User Creation:** User `uidA` creates `/users/uidB` with `{ "uid": "uidB", ... }`.
3. **Role Escalation on Create:** User `uidA` creates `/users/uidA` with `{ "role": "admin", ... }`.
4. **Role Escalation on Update:** User `uidA` updates `/users/uidA` changing `role` to `"business"` or `"admin"`.
5. **Shadow / Ghost Field Injection:** User `uidA` sends valid fields plus `{ "isVerified": true }` or `{ "creditBalance": 999999 }`.
6. **Unverified Email Spoofing:** User authenticates with `email: "abdelrahmanamr895@gmail.com"` but `email_verified: false` attempting admin read/write.
7. **Cross-User PII Read:** Authenticated user `uidA` performs `get(/users/uidB)`.
8. **Collection Scraping:** Non-admin authenticated user performs `list(/users)`.
9. **Client Timestamp Forgery:** User sends `createdAt: Timestamp(2020-01-01)` or mutates `createdAt` on update.
10. **Denial-of-Wallet Oversized Payload:** User sends `name` of 5,000 characters or `photoURL` of 4,000 characters.
11. **Path ID Poisoning:** Request targets `/users/bad$id..with..chars` or >128-char ID.
12. **Self-Admin Grant:** Authenticated user attempts `create` or `update` on `/admins/{uid}`.
