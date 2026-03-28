# Manual User Creation Guide

Since the Supabase Edge Function is not deployed, you need to create users manually through the Supabase Dashboard.

## Quick Steps

### 1. Create Auth User
Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/auth/users

Click **"Add user"** → **"Create new user"**

Fill in:
- **Email**: feysa@gmail.com
- **Password**: (your chosen password)
- **✅ Auto Confirm User**: CHECK THIS BOX
- Click **"Create user"**
- **Copy the User ID** that appears

### 2. Create Profile Record
Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new

Run this SQL (replace `USER_ID_HERE` with the ID from step 1):

```sql
-- For Coordinator (feysa girma)
INSERT INTO profiles (user_id, email, full_name, role, department_id, phone, onboarding_completed)
VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID
  'feysa@gmail.com',
  'feysa girma',
  'coordinator',
  (SELECT id FROM departments WHERE code = 'DES' LIMIT 1),  -- Design department
  '+251 9XX XXX XXX',
  false
);
```

### 3. Verify
Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/editor

Click on **profiles** table and verify the user exists.

### 4. Test Login
- Go to your app: http://localhost:8080
- Log in with the email and password you created
- User should be able to access the system

---

## For Different Roles

### Student
```sql
INSERT INTO profiles (user_id, email, full_name, role, department_id, phone, onboarding_completed)
VALUES (
  'USER_ID_HERE',
  'student@example.com',
  'Student Name',
  'student',
  (SELECT id FROM departments WHERE code = 'DES' LIMIT 1),
  '+251 9XX XXX XXX',
  false
);
```

### Advisor
```sql
INSERT INTO profiles (user_id, email, full_name, role, department_id, phone, onboarding_completed)
VALUES (
  'USER_ID_HERE',
  'advisor@example.com',
  'Advisor Name',
  'advisor',
  (SELECT id FROM departments WHERE code = 'DES' LIMIT 1),
  '+251 9XX XXX XXX',
  false
);
```

### Company/Employer
```sql
INSERT INTO profiles (user_id, email, full_name, role, phone, onboarding_completed)
VALUES (
  'USER_ID_HERE',
  'company@example.com',
  'Company Name',
  'company',
  '+251 9XX XXX XXX',
  false
);
```

### Admin
```sql
INSERT INTO profiles (user_id, email, full_name, role, onboarding_completed)
VALUES (
  'USER_ID_HERE',
  'admin@example.com',
  'Admin Name',
  'admin',
  true
);
```

---

## Deploying Edge Function (Optional - For Automatic User Creation)

To enable automatic user creation from the dashboard, you need to deploy the Edge Function:

### Prerequisites
- Install Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
- Get your service role key from: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/settings/api

### Steps
1. Install Supabase CLI (Windows):
   ```bash
   scoop install supabase
   ```
   Or download from: https://github.com/supabase/cli/releases

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   cd internship-platform
   supabase link --project-ref jubbpyoqcarnylbeslyz
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy create-user
   ```

5. Set environment variables in Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/functions
   - Click on `create-user` function
   - Add secrets:
     - `SUPABASE_URL`: https://jubbpyoqcarnylbeslyz.supabase.co
     - `SUPABASE_SERVICE_ROLE_KEY`: (get from API settings)
     - `SUPABASE_ANON_KEY`: sb_publishable_J-UMO7gLqSYgFZzIQyrODA_MigwzohV

After deployment, the "Create User" button in the admin dashboard will work automatically.

---

## Troubleshooting

### "Email not confirmed" error
Run this SQL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

### "User account setup incomplete" error
The profile record is missing. Run the profile INSERT SQL from step 2.

### Can't find department
List all departments:
```sql
SELECT id, name, code FROM departments;
```

Create a department if needed:
```sql
INSERT INTO departments (name, code, description)
VALUES ('Design', 'DES', 'Design Department');
```

---

## Need Help?

Check the browser console for detailed SQL commands when you try to create a user from the dashboard.
