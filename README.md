# AI Learning Companion 🎓

AI-Powered Adaptive Learning Platform with self-practice quizzes, classroom management, weak area detection, and personalized learning roadmaps.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS 3
- **Backend**: Supabase (Auth, Database, Row Level Security)
- **AI**: Google Gemini API (quiz generation, performance analysis, roadmap generation)

## Features

### Students
- 🧠 **AI Practice Quizzes** — 20 MCQs generated on-demand with timer and explanations
- 📊 **Weak Area Detection** — AI identifies which subtopics need more work
- 🗺️ **Learning Roadmaps** — Personalized step-by-step improvement plans
- 🏫 **Classroom Quizzes** — Join teacher-led classes and take assigned exams

### Teachers
- 🏫 **Class Management** — Create classes with join codes and passwords
- 🤖 **AI Quiz Generation** — Generate classroom quizzes using Gemini AI
- 📈 **Student Analytics** — View individual student performance and answers

### Admins
- 📚 **Topic Management** — Add, edit, delete topics and subtopics
- 👥 **User Management** — View and manage all platform users

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` from the template:
```bash
cp .env.example .env.local
```
Fill in your Supabase URL, Anon Key, and Gemini API Key.

### 3. Set Up Database
Run the SQL schema in your Supabase SQL Editor:
- Open `supabase_schema.sql`
- Copy and paste into **Supabase Dashboard → SQL Editor → New Query**
- Run the query

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── login/          # Email + OAuth login
│   ├── register/       # Registration with role selection
│   ├── student/        # Student dashboard, practice, history, roadmaps
│   ├── teacher/        # Teacher dashboard, class management, quiz creation
│   └── admin/          # Admin panel for topics and users
├── components/         # Reusable UI components
├── context/            # React context (AuthContext)
├── services/           # Supabase database operations
├── hooks/              # Custom React hooks
├── lib/                # Supabase client, Gemini AI, utilities
├── constants/          # Role definitions, quiz types
└── types/              # JSDoc type definitions
```

## Authentication Flow

1. User registers with email/password or Google OAuth
2. Supabase trigger auto-creates a profile row with selected role
3. AuthContext fetches profile and provides role-based state
4. ProtectedRoute component enforces RBAC on each page
