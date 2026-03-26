# TCG Website Launch Fix — Design Spec

**Date:** 2026-03-25
**Goal:** Fix all broken functionality, harden security, and verify live deployment before tomorrow's launch.
**Environment:** Next.js 16 on Vercel, Supabase (PostgreSQL), live at production URL.

---

## Team Structure

| Agent | Model | Role | Isolation |
|-------|-------|------|-----------|
| **Team Lead** | Opus | Final code review, merge, deploy, live verification | Main repo |
| **Bug Hunter** | Sonnet | Systematically test every page/feature, produce categorized bug report | Git worktree |
| **Fixer** | Sonnet | Implement all fixes based on bug report | Git worktree |
| **QC** | Sonnet | Review every fix, run build, verify correctness, sign off | Git worktree |

### Reporting Chain
```
Bug Hunter → QC (validates bug list is complete)
Fixer → QC (reviews every fix)
QC → Team Lead (signs off on all work)
Team Lead → final code review + live verification
```

---

## Work Categories

### Category 1: Critical — Blocks Launch

1. **Admin inventory click-through broken** — clicking into inventory items doesn't work or errors out
2. **Activity logging crashes on Vercel** — `logActivity()` writes to filesystem, which is read-only on Vercel; silently fails, breaks activity log page
3. **Backup system uses filesystem** — `/admin/backups` writes to local files, completely non-functional on Vercel
4. **JSON fallback files empty** — `inventory.json`, `accessories.json`, `orders.json` etc. are all empty `[]`; if Supabase query fails, site shows zero data
5. **Bulk pricing partial failure** — no transaction wrapping; if error occurs mid-update, some prices update and some don't
6. **CSV upload lacks validation** — invalid data (negative prices, bad conditions, wrong game names) can be inserted directly into database
7. **Admin pages crash on unexpected API data** — no error boundaries, no type guards on JSON parsing

### Category 2: Security — Required Before Public Launch

8. **Migrate all admin auth to Supabase** — remove hardcoded plaintext credentials from `.env.local`, use proper password hashing
9. **Replace weak auth secret** — current secret is a placeholder string; generate proper random secret
10. **Add CSRF protection** — admin POST endpoints have no CSRF defense

### Category 3: Reliability

11. **YGOPRODeck API calls have no retry logic** — if API is slow/down, pricing update fails silently
12. **Race condition on concurrent inventory edits** — no optimistic locking; two admins editing same item lose changes
13. **N+1 query in inventory stats** — fetches all inventory to count unique cards instead of using SQL aggregation
14. **Pricing rule display crashes on undefined** — `item.pricingRule` accessed without null check

### Category 4: Bug Hunter Discovers

Items 1-14 are from static code analysis. The Bug Hunter agent will discover additional runtime bugs by actually navigating every page and feature. These will be added to the fix list dynamically.

---

## Technical Approach

### Vercel Filesystem Fixes (Items 2, 3)
- **Activity logging:** Migrate from `fs.writeFileSync` to Supabase `activity_log` table
- **Backups:** Migrate to Supabase-based export/import (generate JSON in memory, return as download)

### Database Reliability (Items 4, 5, 13)
- **Remove JSON fallback entirely** — Supabase is the single source of truth; if it's down, show proper error state instead of empty data
- **Bulk pricing:** Wrap updates in a Supabase transaction or validate-all-then-write pattern
- **Stats:** Replace in-memory counting with `SELECT COUNT(DISTINCT card_name)` etc.

### Security Hardening (Items 8, 9, 10)
- **Auth:** Team members already in Supabase `team` table (recent migration). Remove `ADMIN_USERS` env var and hardcoded fallback. Use bcrypt hashing for passwords.
- **Auth secret:** Generate cryptographically random secret, update `.env.local`
- **CSRF:** Add `SameSite=Strict` to auth cookie + verify `Origin` header on mutations

### Input Validation (Items 6, 7, 14)
- **CSV:** Validate game, condition, edition against known enums; reject negative prices; sanitize all string inputs
- **Error boundaries:** Add React error boundary component wrapping admin pages
- **Null checks:** Guard all optional property access (`pricingRule`, etc.)

### API Resilience (Item 11)
- Add retry with exponential backoff for YGOPRODeck API calls (max 3 retries)

### Concurrency (Item 12)
- Add `updated_at` timestamp check before writing inventory updates; reject if stale

---

## Workflow

1. **Bug Hunter** explores every admin page and storefront feature, produces a categorized bug list with reproduction steps
2. **Bug Hunter** reports to **QC** for validation that the list is thorough
3. **Fixer** receives the validated bug list plus the static analysis items above, implements fixes
4. **Fixer** reports to **QC** after each batch of fixes
5. **QC** reviews code changes, runs `npm run build`, verifies fixes address the reported bugs
6. **QC** signs off and reports to **Team Lead**
7. **Team Lead** does final code review of all changes
8. **Team Lead** merges to master and pushes to Vercel
9. **Team Lead** verifies every feature works on the live site
10. **Done** — site is ready for launch

---

## Success Criteria

- All admin pages load without errors
- Inventory management: view, add, edit, delete all work
- Bulk pricing preview and apply both work
- CSV upload validates and imports correctly
- Activity log records actions (stored in Supabase, not filesystem)
- Orders, submissions, reviews pages functional
- Storefront: search, card details, checkout flow all work
- No hardcoded credentials in environment
- Build passes with zero errors
- Live site verified by Team Lead
