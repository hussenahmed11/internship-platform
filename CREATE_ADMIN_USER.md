# Creating Your First Admin User

Your Supabase project is empty. Follow these steps to create your first admin user.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Create Auth User
1. Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@haramayauniversity.edu.et` (or your email)
   - **Password**: Choose a strong password (min 8 characters)
   - **Auto Confirm User**: ✅ CHECK THIS BOX (important!)
4. Click **"Create user"**
5. **Copy the User ID** (you'll need it in the next step)

### Step 2: Create Profile Record
1. Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new
2. Run this SQL (replace `USER_ID_HERE` with the ID you copied):

```sql
INSERT INTO profiles (user_id, email, full_name, role, onboarding_completed)
VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID from Step 1
  'admin@haramayauniversity.edu.et',  -- Same email as Step 1
  'System Administrator',
  'admin',
  true
);
```

### Step 3: Verify
1. Go to: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/editor
2. Click on **profiles** table
3. You should see your admin user

### Step 4: Test Login
1. Run your app: `npm run dev`
2. Open: http://localhost:5173
3. Log in with the email and password you created
4. You should see the Admin Dashboard

---

## Method 2: Using SQL Only

If you prefer to do everything in SQL:

### Step 1: Run This SQL
Go to SQL Editor and run:

```sql
-- Create auth user and profile in one go
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users (this creates the authentication user)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@haramayauniversity.edu.et',  -- Change this email
    crypt('YourPassword123!', gen_salt('bf')),  -- Change this password
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Administrator"}',
    false,
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Insert into profiles table
  INSERT INTO profiles (user_id, email, full_name, role, onboarding_completed)
  VALUES (
    new_user_id,
    'admin@haramayauniversity.edu.et',  -- Same email as above
    'System Administrator',
    'admin',
    true
  );

  -- Output the user ID
  RAISE NOTICE 'Admin user created with ID: %', new_user_id;
END $$;
```

**Important**: Change the email and password in the SQL above!

---

## Creating Additional Users

Once you have an admin account, you can create other users through the application:

### Using Admin Dashboard
1. Log in as admin
2. Go to **Users** section
3. Click **"Create User"**
4. Fill in the form:
   - Email
   - Full name
   - Role (student, employer, advisor, coordinator, admin)
   - Department (if applicable)
5. Click **"Create User"**

The system will:
- Create the auth user in Supabase
- Create the profile record
- Send a welcome email (if configured)

---

## User Roles Explained

### Admin
- Full system access
- Can create/manage all users
- Access to analytics and audit logs
- Can configure platform settings

### Student
- Apply for internships
- Upload documents
- Track application status
- Message advisors

### Employer (Company)
- Post internship opportunities
- Review applications
- Schedule interviews
- Manage company profile

### Advisor
- View assigned advisees
- Review student applications
- Approve/reject applications
- Provide feedback

### Coordinator
- Oversee entire program
- Final approval of applications
- Manage departments
- Generate reports
- Verify companies

---

## Troubleshooting

### "Email not confirmed" error
- Make sure you checked **"Auto Confirm User"** when creating the user
- Or run this SQL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your@email.com';
```

### "User account setup incomplete" error
- The profile record is missing
- Run the profile INSERT SQL from Step 2 above

### Can't log in
- Verify user exists in auth.users table
- Verify profile exists in profiles table
- Check that email matches in both tables
- Verify password is correct

### "Permission denied" errors
- Make sure RLS policies are set up (see SUPABASE_SETUP.md)
- Verify user role is set correctly in profiles table

---

## Quick Verification Queries

Check if user exists in auth:
```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@haramayauniversity.edu.et';
```

Check if profile exists:
```sql
SELECT id, user_id, email, full_name, role 
FROM profiles 
WHERE email = 'admin@haramayauniversity.edu.et';
```

Check if they're linked correctly:
```sql
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  p.id as profile_id,
  p.email as profile_email,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@haramayauniversity.edu.et';
```

---

## Next Steps

After creating your admin user:

1. ✅ Log in to verify it works
2. ✅ Create departments (if needed)
3. ✅ Create additional users
4. ✅ Configure email templates (optional)
5. ✅ Set up storage buckets for file uploads (optional)

---

## Need Help?

- Check SUPABASE_SETUP.md for database setup
- Check README.md for general information
- Check Supabase logs in dashboard for errors
- Check browser console for frontend errors
