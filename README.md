# Internship Management System

A comprehensive platform for managing university internship programs, built with React, TypeScript, and Supabase.

## Quick Setup

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

Get your anon key from: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz/settings/api

### 3. Set Up Database
See `SUPABASE_SETUP.md` for complete database setup instructions including:
- Database schema SQL
- Row Level Security policies
- Authentication configuration

### 4. Create Admin User
See `CREATE_ADMIN_USER.md` for step-by-step instructions to create your first admin user.

### 5. Run Development Server
```bash
npm run dev
```

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI**: Shadcn UI + Tailwind CSS
- **State**: TanStack Query
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build**: Vite

## Features

- Role-based access control (Admin, Student, Employer, Advisor, Coordinator)
- Internship posting and application management
- Multi-level approval workflow
- Document management
- Real-time notifications
- Messaging system
- Analytics dashboard
- Audit logging

## User Roles

- **Admin**: Full system access, user management
- **Student**: Apply for internships, track applications
- **Employer**: Post internships, review applications
- **Advisor**: Review student applications, provide guidance
- **Coordinator**: Oversee program, final approvals

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify
1. Push code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

## Support

- **Database Setup**: See `SUPABASE_SETUP.md`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/jubbpyoqcarnylbeslyz
- **Supabase Docs**: https://supabase.com/docs

## License

MIT
