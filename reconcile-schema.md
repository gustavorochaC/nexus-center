# Plan: Reconcile Schema Mismatch

## Situation
- **Actual Database**: Tables `public.hub_profiles`, `public.hub_apps` exist.
- **Frontend Code**: Expects `hub.profiles`, `hub.applications` (implied by types or previous migrations).
- **Service Code**: Calls `hub_get_user_applications` (RPC).

## Mismatch Analysis
1. **Table Names**: Code uses `hub_apps` (verified in `applications.ts`), DB has `hub_apps`. **MATCH ✅**
   - Wait, `explorer` said `applications.ts` uses `hub_apps`.
   - User said DB has `hub_apps`.
   - So why did it fail? "Relation does not exist"?
   - Maybe it failed on RPC?

2. **Column Names**:
   - DB `hub_apps`: `is_public` (boolean), `url` (text), `category` (text)
   - Schema `001`: `is_active`, `base_url`?
   - **MISMATCH ❌**: Columns are different!

3. **RPC Function**:
   - Code calls `hub_get_user_applications`.
   - Does this function exist in DB?
   - If not, Dashboard fails.

## Action Plan (Code-First Fix)
Instead of forcing the DB to match the "Ideal Schema", I will **update the Frontend Code** to match the **Existing Database**.

1. **Update Types**: Modify `src/types/database.ts` to reflect the REAL columns (`url`, `category`, `is_public`).
2. **Update Service**: Modify `src/services/applications.ts`.
   - Remove RPC call (likely doesn't exist or is wrong).
   - Use direct `select` on `hub_apps`.
   - Filter locally or using simple filters.

## Verification
- [ ] Dashboard loads.
- [ ] Apps list appears.
