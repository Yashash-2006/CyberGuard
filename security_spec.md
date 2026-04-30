# Security Specification - CyberGuard

## Data Invariants
1. A Threat record must always be linked to the `userId` of the user who performed the scan.
2. User statistics are private and only accessible by the owner.
3. Anonymized signatures are readable by all authenticated users but writes must be validated and cannot be modified after creation.
4. All string fields must have size constraints.

## "The Dirty Dozen" Payloads (Attacks)
1. **Identity Spoofing (Threats)**: Try to create a threat record with `userId` as another user.
2. **Access Breach (Stats)**: Try to read another user's stats document.
3. **Ghost Field Injection**: Add `isAdmin: true` to a User document.
4. **ID Poisoning**: Use a 2KB string as a document ID for a threat.
5. **State Shortcut**: Create a threat record with status 'blocked' without going through analysis (simulated).
6. **Immutable Field Attack**: Try to change the `userId` on an existing threat.
7. **PII Leak**: Putting personal info in 'content' and making it public (though content in private threats is fine, signatures must be anonymized).
8. **Denial of Wallet**: Sending massive arrays or strings.
9. **Relational Orphan**: Creating a threat record if the User profile doesn't exist (optional but good for consistency).
10. **Timestamp Fraud**: Sending a client-side timestamp as `createdAt` instead of server timestamp.
11. **Blanket Read Attack**: Trying to `list` all threats without a `where` clause on `userId`.
12. **Signature Spam**: Creating tons of empty signatures.

## Test Runner (Logic Check)
The `firestore.rules.test.ts` will verify these rejections.
