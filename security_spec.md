# Security Specification & Test Protocol (SERVI-DOX)

## 1. Data Invariants
- **Identity Integrity**: Master Admin `zinemoh106@gmail.com` has full supervisory access to manage employees and all business records.
- **Client & Dossier Protection**: Clients, auto-entrepreneurs, and activity logs can only be created or modified by authenticated users with verified credentials.
- **Field-level bounds**: Strict maxLength limits and required keys are enforced on every collection to prevent data injection and wallet denial.
- **RBAC Immutability**: Standard users cannot elevate their own role to 'Administrateur' or self-approve their pending account status.
- **Default Deny Catch-All**: Any unspecified collections or paths are blocked by default.

## 2. The "Dirty Dozen" Payloads (Must be blocked)
1. **Unauthenticated Write**: Creating a client document without an active auth session -> REJECTED.
2. **Ghost Field Injection**: Adding an unpermitted field `isSuperAdmin: true` to `/clients/{clientId}` -> REJECTED.
3. **Huge String Injection**: Submitting an ID longer than 128 characters or name > 100 characters -> REJECTED.
4. **Self-Assigned Admin**: An unverified user attempting to set `role: "Administrateur"` on their user profile -> REJECTED.
5. **Orphaned Activity Log**: Logging an activity without a valid client name and author -> REJECTED.
6. **Unpermitted Deletion**: Non-admin deleting employee records from `/employees/{id}` -> REJECTED.
7. **Negative Montant Corruption**: Injecting negative amounts for fees or salaries -> REJECTED.
8. **Malicious Path Injection**: Setting an invalid character in a document ID (e.g., path traversal `../../`) -> REJECTED.
9. **Fake Email Verification**: Spoofing admin email with unverified token claim -> REJECTED.
10. **Tampering with Audit Logs**: Modifying or overwriting existing historical entries in `/activityLogs` -> REJECTED.
11. **Client Identity Hijack**: Overwriting another user's private session record at `/users/{otherId}` -> REJECTED.
12. **Blanket Query Scraping**: Listing collections without authentication -> REJECTED.
