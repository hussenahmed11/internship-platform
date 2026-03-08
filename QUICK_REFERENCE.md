# Quick Reference

## 🚀 Getting Started (First Time)

1. **Install**: `npm install`
2. **Configure**: Update `.env` with your Supabase anon key
3. **Database**: Run SQL from `SUPABASE_SETUP.md` sections 3 & 4
4. **Admin User**: Follow `CREATE_ADMIN_USER.md`
5. **Start**: `npm run dev`

---

## 📋 Essential Links

### Your Supabase Project
- **Dashboard**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz
- **API Keys**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/settings/api
- **SQL Editor**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/sql/new
- **Auth Users**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/auth/users
- **Database**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/editor

---

## 🔑 Create Admin User (Quick)

### Method 1: Dashboard (Easiest)
1. Go to Auth Users → Add user
2. Email: `admin@haramayauniversity.edu.et`
3. Password: (your choice)
4. ✅ Check "Auto Confirm User"
5. Copy the User ID
6. Go to SQL Editor and run:
```sql
INSERT INTO profiles (user_id, email, full_name, role, onboarding_completed)
VALUES ('PASTE_USER_ID', 'admin@haramayauniversity.edu.et', 'Admin', 'admin', true);
```

### Method 2: SQL Only
Run in SQL Editor (change email/password):
```sql
DO $$
DECLARE new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'admin@haramayauniversity.edu.et',
    crypt('YourPassword123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin"}'
  ) RETURNING id INTO new_user_id;

  INSERT INTO profiles (user_id, email, full_name, role, onboarding_completed)
  VALUES (new_user_id, 'admin@haramayauniversity.edu.et', 'Admin', 'admin', true);
END $$;
```

---

## 🛠️ Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

---

## 🔍 Verification Queries

### Check if user exists:
```sql
SELECT u.email, u.email_confirmed_at, p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'your@email.com';
```

### List all users:
```sql
SELECT p.email, p.full_name, p.role, p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
```

### Check RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 🐛 Troubleshooting

### Can't log in
- ✅ User exists in auth.users?
- ✅ Profile exists in profiles table?
- ✅ Email confirmed? (email_confirmed_at not null)
- ✅ Emails match in both tables?

### Permission denied errors
- ✅ RLS policies created? (Run section 4 of SUPABASE_SETUP.md)
- ✅ User role set correctly?

### Missing environment variables
- ✅ .env file exists?
- ✅ VITE_SUPABASE_ANON_KEY set?
- ✅ Restart dev server after changing .env

---

## 📚 Documentation

- `README.md` - Project overview
- `SUPABASE_SETUP.md` - Database setup
- `CREATE_ADMIN_USER.md` - User creation guide
- `.env.example` - Environment template

---

## 🎯 User Roles

| Role | Access |
|------|--------|
| admin | Full system access |
| student | Apply for internships |
| employer | Post internships |
| advisor | Review applications |
| coordinator | Oversee program |

---

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
