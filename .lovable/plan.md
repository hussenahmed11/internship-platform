

# Admin Dashboard: Remove Hardcoded Data and Implement Real Features

## Current State Assessment

After reviewing the codebase, most admin pages already use real database queries. Here is what needs fixing:

**Already Real (no changes needed):**
- Admin Dashboard stats (users, companies, students, internships)
- Recent Activity feed (from profiles + applications)
- System Health checks (real latency tests)
- Users page (full CRUD via edge function)
- Departments page (full CRUD with live stats)
- Companies page (verify/delete with real data)
- Analytics page (all charts from real data)

**Needs Work:**

### 1. Admin Settings Page — Fully Hardcoded
The entire settings page is static HTML with no database persistence. Switches do nothing, buttons don't save.

**Fix:** Create a `platform_settings` table (key-value store) and wire up all settings to read/write from it. The System tab will show real active user counts and database status from the existing `useSystemHealth` hook.

### 2. Internships Page — Missing Admin Actions
Search input exists but doesn't filter. No approve/edit/delete actions for admins. No status filtering.

**Fix:** Wire up search filtering, add status filter dropdown, add admin action menu (change status, delete) via dropdown on each card.

### 3. Admin Dashboard — Missing Pending Actions & Alerts
The dashboard shows stats and activity but has no "pending actions" section showing items requiring admin attention.

**Fix:** Add a "Pending Actions" card showing: unverified companies count, pending applications count, and users who haven't completed onboarding.

### 4. FeaturePlaceholder — Remove for Admin Routes
The Departments route wraps with `DashboardLayout` twice (once in App.tsx, once inside the component). Several admin-adjacent routes still show placeholder.

---

## Technical Plan

### Database Migration
Create `platform_settings` table:
```sql
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
-- RLS: only admins can read/write
```
Seed default settings rows for: `general`, `security`, `notifications`.

### File Changes

1. **`src/pages/AdminSettings.tsx`** — Full rewrite
   - Fetch settings from `platform_settings` table
   - Save changes per tab via `upsert`
   - System tab: use `useSystemHealth` hook for real DB status, query real active user count
   - Remove all hardcoded default values

2. **`src/pages/Internships.tsx`** — Add admin features
   - Wire search input to filter internships by title/company/skills
   - Add status filter select (All, Active, Draft, Closed, Filled)
   - Add admin action dropdown menu per card (Change Status, Delete)
   - Add mutation for status update and delete

3. **`src/components/dashboards/AdminDashboard.tsx`** — Add pending actions
   - Query unverified companies count
   - Query pending (unapproved) applications count
   - Query profiles with `onboarding_completed = false` count
   - Display as a "Pending Actions" card with action buttons linking to relevant pages

4. **`src/pages/Departments.tsx`** / **`src/pages/Companies.tsx`** — Remove duplicate `DashboardLayout` wrapper
   - These pages include `<DashboardLayout>` internally but are also wrapped in App.tsx. Remove the internal wrapper.

