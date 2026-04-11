# InternHub: Professional Internship Placement Management System

InternHub is a premium, full-stack internship management platform designed to bridge the gap between universities, students, and the professional world. Built with a focus on data integrity, specialized roles, and a seamless user experience, InternHub automates the complete internship lifecycle.

### 🌐 [Live Demo](https://internship-platform-l2ghr47kv-hussen-ahmeds-projects.vercel.app)

---

## ✨ Core Feature Highlights

### 🛡️ Data Integrity & Verification
- **Student Verification Pipeline**: Unique to InternHub, Advisors can audit student profile data (Student ID, Major) before granting application permissions.
- **Advisor Evaluation Module**: A comprehensive performance review system allowing advisors to submit detailed evaluations (1-5 star ratings, feedback, and learning outcomes) for their advisees.
- **Smart Onboarding**: Dynamic role-based profile completion that ensures the right data is collected from the right users.

### 📊 Advanced Placement Tracking
- **Placement Data Flow Trace**: A standout 17-step lifecycle visualization that tracks every stage from user creation to final placement confirmation.
- **Centralized Placement Log**: A master record for Admins and Coordinators to monitor system-wide progress and detect bottlenecks.

### 🌓 Premium User Experience
- **Instant Dark Mode**: A system-integrated theme engine with persistence and smooth transitions.
- **Modern UI Kit**: Built with Shadcn UI and Tailwind CSS for a professional, glassmorphic aesthetic.
- **Refined Authentication**: A clean, centered minimal login experience with intelligent role redirection and Google Sign-In support.

### 👥 Specialized User Roles
| Role | Responsibility | Key Features |
| :--- | :--- | :--- |
| **Admin** | Platform Oversight | User Sync, Role Management, System Audits, Department Config |
| **Coordinator** | Program Strategy | Placement Records, Analytics, System-wide Approval |
| **Advisor** | Data Guardianship | Student Verification, Evaluations, Advisee Management |
| **Employer** | Talent Acquisition | Internship Posting, Candidate Review, Interview Scheduling |
| **Student** | Career Growth | Profile Building, Internship Discovery, Application Tracking |

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    A[Vite/React Frontend] --> B[TanStack Query]
    B --> C[Supabase Auth]
    B --> D[PostgreSQL Database]
    D --> E[Real-time Messages]
    A --> F[Shadcn UI Theme Engine]
    Role[Roles: Admin, Advisor, Student...] --> A
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase Account

### 2. Initial Setup
```bash
# Install dependencies
npm install

# Setup Environment
# Create .env and add your variables:
# VITE_SUPABASE_URL=your_project_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Sync
To set up the required table structures and RLS policies, run the migrations provided in the `supabase/migrations` directory within your Supabase SQL editor.

### 4. Running Locally
```bash
npm run dev
```

---

## 🛠️ Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, Radix UI (Shadcn/UI), Lucide Icons
- **Data & Auth**: Supabase (PostgreSQL, Auth, Real-time)
- **State Orchestration**: TanStack Query (React Query)
- **Validation**: Zod + React Hook Form
- **Utilities**: Date-fns, Sonner (Toasts), Framer Motion

---

## 🧪 Development & Maintenance

- **`npm run build`**: Create a production-optimized build.
- **`npm run lint`**: Perform project-wide linting checks.
- **`npm run test`**: Run the test suite using Vitest.
- **`npm run preview`**: Test the production bundle locally.

## 📄 License
InternHub is released under the MIT License.

---

## 📈 Recent Improvements
- **Advisor Evaluation System**: Added a robust module for advisors to review student performance with ratings and skill tagging.
- **UI & Navigation Refresh**: Simplified the Auth flow with a centered layout and added "Back to Home" navigation for better UX.
- **RLS Robustness**: Enhanced Row-Level Security policies to ensure secure cross-table access for advisors and students.
- **Flow Trace Integration**: Integrated the Evaluation status into the master Placement Records timeline.

---
*Built with ❤️ for Universities and Career Centers seeking excellence in placement management.*
