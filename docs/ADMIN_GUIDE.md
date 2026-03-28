# Admin Guide - User Sync & Profile Completion

## 🚨 Quick Fix: Users Not Showing (2 Minutes)

If you have users in Supabase Auth but they're not showing in your application:

### Step 1: Apply Database Migration
```bash
cd internship-platform
supabase db push
```

### Step 2: Sync Users
1. Log in as admin
2. Go to **User Management** or **Admin Dashboard**
3. Click **"Sync Users"** button (top right)
4. Wait for success message
5. Refresh the page

✅ **Done!** All users should now be visible.

---

## Understanding the Issue

### The Problem
```
Supabase Auth: 3 users ✅
Your App Database: 1 user ❌
Result: Only 1 user visible in UI
```

### Why It Happens
When users are created in Supabase Auth (either via dashboard or admin panel), sometimes the profile creation in your application database fails due to:
- RLS (Row Level Security) policies
- Trigger execution issues
- Network timeouts

### The Solution
The sync function:
1. Reads all users from Supabase Auth
2. Finds users without profiles
3. Creates missing profiles
4. Sets up role-specific records
5. Marks them for onboarding

---

## Features Implemented

### 1. User Sync System
- **Sync Users Button**: Manually sync auth users with profiles
- **Automatic Trigger**: New users get profiles automatically
- **Sync Status Indicator**: Shows when users are out of sync
- **RLS Bypass**: Functions use elevated privileges for accuracy

### 2. Profile Completion Flow
- **First Login Redirect**: Users redirected to onboarding
- **Role-Specific Forms**: Different fields for students, companies, advisors
- **Required Fields**: Validation ensures complete data
- **Cannot Bypass**: System blocks access until profile complete

### 3. Accurate Dashboard Counts
- **Bypasses RLS**: Gets accurate counts from database
- **Real-time Updates**: Dashboard refreshes after sync
- **Role Distribution**: Shows breakdown by user type
- **Sync Status**: Alerts when users are out of sync

---

## Database Functions

The migration creates these functions:

### `sync_auth_users_to_profiles()`
Syncs all Supabase Auth users to profiles table.
- Creates missing profiles
- Sets up role-specific records
- Returns sync count and status

### `get_admin_dashboard_stats()`
Returns accurate dashboard statistics.
- Total users
- Users by role
- Active companies
- Incomplete onboarding count

### `get_user_sync_status()`
Shows sync status between auth and profiles.
- Auth users count
- Profiles count
- Missing profiles count

### `has_role(user_id, role)`
Checks if a user has a specific role.

### `user_needs_onboarding(user_id)`
Checks if user needs to complete onboarding.

### `complete_onboarding(profile_id)`
Marks user onboarding as complete.

---

## Verification

### Check Sync Status (SQL)
```sql
SELECT 
  (SELECT count(*) FROM auth.users) as auth_users,
  (SELECT count(*) FROM public.profiles) as profiles,
  (SELECT count(*) FROM auth.users au 
   LEFT JOIN public.profiles p ON p.user_id = au.id 
   WHERE p.id IS NULL) as missing_profiles;
```

Expected: `missing_profiles` should be 0

### Check Onboarding Status (SQL)
```sql
SELECT 
  role,
  onboarding_completed,
  count(*) as user_count
FROM public.profiles
GROUP BY role, onboarding_completed
ORDER BY role, onboarding_completed;
```

---

## Troubleshooting

### Sync Button Doesn't Appear
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify you're logged in as admin
3. Check browser console for errors

### Sync Button Does Nothing
1. Open browser console (F12)
2. Click "Sync Users"
3. Look for error messages
4. Verify migration was applied successfully

### Still Shows Wrong Count After Sync
1. Hard refresh the page
2. Click "Sync Users" again
3. Check Supabase logs for errors
4. Run verification SQL above

### Users Not Redirected to Onboarding
1. Check browser console logs
2. Clear browser cache and localStorage
3. Verify migration applied
4. Check `onboarding_completed` flag in database

### Migration Fails
- Check if already applied (that's OK)
- Check Supabase logs for specific errors
- Try applying manually via SQL Editor

---

## Maintenance

### Daily
- Monitor dashboard for accuracy
- Check for user issues

### Weekly
- Click "Sync Users" to ensure consistency
- Review incomplete onboarding count
- Follow up with users who haven't completed profiles

### Monthly
- Review onboarding completion rate
- Check for any sync issues
- Update documentation if needed

---

## Manual Database Sync (Alternative)

If the button doesn't work, you can sync manually via SQL:

```sql
-- Run this in Supabase SQL Editor
SELECT public.sync_auth_users_to_profiles();
```

---

## Emergency: Skip Onboarding for All Users

If you need to temporarily disable onboarding:

```sql
-- WARNING: This bypasses profile completion
UPDATE public.profiles SET onboarding_completed = true;
```

Use this only in emergencies. Users should complete their profiles.

---

## Support

For issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify migration applied successfully
4. Check RLS policies allow admin access
5. Verify trigger function is active
