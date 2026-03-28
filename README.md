# Internship Management System

A comprehensive platform for managing university internship programs, built with React, TypeScript, and Supabase.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file (use `.env.example` as template):
```env
VITE_SUPABASE_URL=https://jubbpyoqcarnylbeslyz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
```

Get your anon key from: [Supabase API Settings](https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/settings/api)

### 3. Set Up Database
```bash
# Apply all migrations
supabase db push
```

See [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) for manual setup instructions.

### 4. Create Admin User
See [docs/MANUAL_USER_CREATION_GUIDE.md](./docs/MANUAL_USER_CREATION_GUIDE.md) for step-by-step instructions.

### 5. Run Development Server
```bash
npm run dev
```

## 📚 Documentation

- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common commands and quick fixes
- **[Admin Guide](./docs/ADMIN_GUIDE.md)** - User sync and profile completion
- **[Supabase Setup](./docs/SUPABASE_SETUP.md)** - Database configuration
- **[User Creation](./docs/MANUAL_USER_CREATION_GUIDE.md)** - Creating users manually

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI**: Shadcn UI + Tailwind CSS
- **State**: TanStack Query
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build**: Vite

## ✨ Features

- Role-based access control (Admin, Student, Employer, Advisor, Coordinator)
- Internship posting and application management
- Multi-level approval workflow
- Document management
- Real-time notifications
- Messaging system
- Analytics dashboard
- Audit logging
- User sync system
- Profile completion flow

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access, user management |
| **Student** | Apply for internships, track applications |
| **Employer** | Post internships, review applications |
| **Advisor** | Review student applications, provide guidance |
| **Coordinator** | Oversee program, final approvals |

## 🛠️ Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🚨 Common Issues

### Users Not Showing in Dashboard
If you have users in Supabase Auth but they're not showing in your application:

1. Apply the migration: `supabase db push`
2. Log in as admin
3. Click "Sync Users" button in User Management or Admin Dashboard
4. Refresh the page

See [docs/ADMIN_GUIDE.md](./docs/ADMIN_GUIDE.md) for detailed troubleshooting.

### Can't Log In
- Verify user exists in Supabase Auth
- Check email is confirmed
- Ensure profile record exists in database

See [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) for verification queries.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Netlify
1. Push code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

## 📞 Support

- **Supabase Dashboard**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz
- **Supabase Docs**: https://supabase.com/docs
- **Project Docs**: See [docs/](./docs/) folder

## 📄 License

MIT
