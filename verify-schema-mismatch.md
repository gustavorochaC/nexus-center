# Verification Plan: Schema Mismatch Diagnosis

## Overview
**Goal**: Verify the hypothesis that the dashboard timeout is caused by a mismatch between Frontend RPC calls (`hub_get_user_applications`) and Database Schema (`hub.get_user_applications`).
**Why**: User requested verification ("tu tem certeza disso?") before applying database changes.
**Project Type**: WEB (React + Supabase)

## Success Criteria
- [ ] Confirmed exact function name called by Frontend.
- [ ] Confirmed exact function name and schema in Database.
- [ ] Confirmed Supabase Client schema configuration.
- [ ] Verified if `hub` schema functions are accessible via default `public` API.

## Tech Stack
- **Frontend**: React, TypeScript, Supabase JS
- **Backend**: Supabase (PostgreSQL)
- **Tools**: SQL Editor (simulated), Code Analysis

## File Structure
- `src/services/applications.ts` (Frontend logic)
- `src/lib/supabase.ts` (Client config)
- `supabase/migrations/001_initial_schema.sql` (Database source)

## Task Breakdown

### Phase 1: Codebase Analysis
**Agent**: `explorer-agent`
- [ ] **Task 1.1**: Map Frontend RPC Calls
  - Input: `src/services/applications.ts`
  - Output: List of all `rpc()` and `from()` calls.
  - Verify: exact string names used (e.g. `hub_get_user_applications`).
- [ ] **Task 1.2**: Check Supabase Client Config
  - Input: `src/lib/supabase.ts`
  - Output: `db.schema` configuration value.
  - Verify: Is it 'public', 'hub', or undefined?

### Phase 2: Schema Analysis
**Agent**: `database-architect`
- [ ] **Task 2.1**: Map Database Schema
  - Input: `supabase/migrations/001_initial_schema.sql`
  - Output: List of actual Tables and Functions in `hub` schema.
  - Verify: mismatch between `hub.table` and `hub_table`.
- [ ] **Task 2.2**: API Exposure Check
    - Input: Schema definition
    - Output: Are views created in public?

### Phase 3: Root Cause Confirmation
**Agent**: `backend-specialist`
- [ ] **Task 3.1**: API Accessibility Check
  - Input: Findings from Phase 1 & 2.
  - Analysis: Docs check or Logic check - can `supabase-js` call `hub.function` using `hub_function` alias automatically?
  - Verify: "No" -> Mismatch confirmed.

## Phase X: User Verification
- [ ] Report Findings to User to answer "Are you sure?"
- [ ] If confirmed, proceed with `002_fix_api_mismatch.sql`
