# AI-Powered Adaptive Learning Companion — Implementation Plan

## Overview

Transform the existing single-role Firebase-based quiz app into a full multi-role adaptive learning platform with **Supabase** as the backend. The system will support **Student**, **Teacher**, and **Admin** roles with two learning modes: **Self-Practice** and **Classroom**.

### Current State
- Next.js 14 app with Tailwind CSS
- Firebase Auth + Firestore for authentication & data
- Single-role (student-only) quiz system
- AI quiz generation via Gemini API
- Quiz history, roadmap generation, profile page

### Target State
- **Supabase** Auth + Postgres for authentication & data
- Three roles: Student, Teacher, Admin
- Self-Practice mode (existing, enhanced)
- Classroom mode (new): Teachers create classes, students join, teacher-conducted quizzes
- Admin panel for topic/subtopic/user management
- Role-based dashboards and access control

---

## User Review Required

> [!IMPORTANT]
> **Database Migration**: All Firebase code will be replaced with Supabase. You will need a Supabase project. Please provide your Supabase URL and anon key (to be stored in `.env.local`).

> [!IMPORTANT]
> **Supabase Credentials**: The plan assumes you will create a Supabase project at [supabase.com](https://supabase.com) and provide:
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> [!WARNING]
> **Breaking Change**: All existing Firebase data will no longer be accessible. This is a full backend migration.

> [!IMPORTANT]
> **Admin Account**: The first admin account will need to be manually set in the Supabase `profiles` table (role = 'admin'). Alternatively, we can seed it via SQL.

---

## Proposed Changes

### Phase 1: Infrastructure — Supabase Setup & Database Schema

#### [NEW] `supabase_schema.sql`
SQL migration file to create all tables in Supabase:

| Table | Key Fields |
|-------|-----------|
| `profiles` | id (FK to auth.users), name, email, role (student/teacher/admin), created_at |
| `topics` | id, topic_name, created_by, created_at |
| `subtopics` | id, topic_id (FK), subtopic_name, created_at |
| `classes` | id, class_name, description, teacher_id (FK), class_password, class_code (unique), created_at |
| `enrollments` | id, class_id (FK), student_id (FK), enrolled_at |
| `quizzes` | id, class_id (FK, nullable), topic_id (FK, nullable), creator_id (FK), difficulty, title, is_published, timer_minutes, quiz_type (self_practice/classroom), created_at |
| `questions` | id, quiz_id (FK), question_text, options (jsonb), correct_answer, explanation, subtopic, question_index |
| `quiz_attempts` | id, quiz_id (FK), student_id (FK), score, total, percentage, time_taken, auto_submit, strong_areas (jsonb), weak_areas (jsonb), answers (jsonb), submitted_at |
| `roadmaps` | id, user_id (FK), quiz_attempt_id (FK, nullable), title, summary, focus_message, phases (jsonb), daily_plan (jsonb), motivational_tip, subject, field, score, created_at |

Row-Level Security (RLS) policies for each table to enforce role-based access.

---

#### [MODIFY] [package.json](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/package.json)
- Remove `firebase` dependency
- Add `@supabase/supabase-js` and `@supabase/ssr`

#### [MODIFY] [.env.local](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/.env.local)
- Remove all `NEXT_PUBLIC_FIREBASE_*` variables
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Keep `NEXT_PUBLIC_GEMINI_API_KEY`

---

### Phase 2: Core Library Layer — Supabase Client & Data Access

#### [NEW] `src/lib/supabase.js`
- Initialize Supabase client (browser-side)
- Export `supabase` singleton

#### [DELETE] [firebase.js](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/lib/firebase.js)

#### [MODIFY] [firestore.js](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/lib/firestore.js) → Rename to `src/lib/db.js`
Complete rewrite with Supabase queries:
- `saveQuizResult()` → insert into `quiz_attempts` + `questions`
- `getQuizHistory()` → select from `quiz_attempts` with user filter
- `getQuizQuestions()` → select from `questions` by quiz_id
- `saveRoadmap()` → insert into `roadmaps`
- `getRoadmapHistory()` → select from `roadmaps` with user filter
- `saveUserProfile()` → upsert into `profiles`
- **NEW**: `createClass()`, `joinClass()`, `getClasses()`, `getClassStudents()`
- **NEW**: `createQuiz()`, `publishQuiz()`, `getClassQuizzes()`, `getStudentPerformance()`
- **NEW**: `getTopics()`, `getSubtopics()`, `addTopic()`, `addSubtopic()`, `deleteTopic()`, `deleteSubtopic()`, `editTopic()`, `editSubtopic()`
- **NEW**: `getAllUsers()`, `deleteUser()`, `changeUserPassword()` (admin)

#### [MODIFY] [gemini.js](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/lib/gemini.js)
- Keep existing AI functions (they don't depend on Firebase)
- Add `generateClassroomQuiz()` function for teacher quiz generation
- Update question count from 25 to 20 per SRS

---

### Phase 3: Authentication & Context

#### [MODIFY] [AuthContext.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/context/AuthContext.jsx)
- Replace Firebase `onAuthStateChanged` with Supabase `onAuthStateChange`
- Fetch user profile (including role) from `profiles` table on auth change
- Export `user`, `profile` (with role), `loading`, `signOut`

#### [NEW] `src/components/ProtectedRoute.jsx`
- Wrapper component that checks authentication and role
- Redirects to login if unauthenticated
- Redirects to appropriate dashboard if wrong role

---

### Phase 4: Auth Pages — Registration with Role Selection & Login

#### [MODIFY] [register/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/register/page.jsx)
- Replace Firebase auth with Supabase `signUp()`
- Add **role selection** (Student / Teacher radio buttons)
- On registration, insert into `profiles` table with selected role
- Remove Google sign-in (or implement Supabase OAuth)
- Premium UI with role selection cards

#### [MODIFY] [login/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/login/page.jsx)
- Replace Firebase auth with Supabase `signInWithPassword()`
- After login, fetch role from `profiles` and redirect to role-specific dashboard
- Remove Google sign-in (or implement Supabase OAuth)

---

### Phase 5: Role-Based Dashboards

#### [MODIFY] [dashboard/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/dashboard/page.jsx)
- Redirect to role-specific dashboard based on user profile:
  - Student → `/student/dashboard`
  - Teacher → `/teacher/dashboard`
  - Admin → `/admin/dashboard`

#### [NEW] `src/app/student/dashboard/page.jsx`
**Student Dashboard** with:
- Welcome header with stats (quizzes taken, avg score, topics completed — fetched from DB)
- **Self-Practice Quiz** card → links to `/student/practice`
- **My Classes** card → links to `/student/classes`
- **Quiz History** card → links to `/student/quiz-history`
- **My Roadmaps** card → links to `/student/roadmaps`
- Recent activity section (real data from DB)

#### [NEW] `src/app/teacher/dashboard/page.jsx`
**Teacher Dashboard** with:
- Welcome header with stats (classes created, quizzes conducted, total students)
- **Create Class** button
- **My Classes** list → links to `/teacher/classes/[id]`
- **Create Quiz** card
- Recent quiz results overview

#### [NEW] `src/app/admin/dashboard/page.jsx`
**Admin Dashboard** with:
- System stats (total users, topics, classes, quizzes)
- **Manage Topics** card → `/admin/topics`
- **Manage Users** card → `/admin/users`
- Quick actions panel

---

### Phase 6: Student Module Pages

#### [NEW] `src/app/student/practice/page.jsx`
- Refactored from existing `quiz/page.jsx`
- Topic → Subtopic → Difficulty selection (from DB topics managed by admin)
- AI generates 20 MCQs
- Timer-based quiz (configurable, default 20 min)
- Auto-submit on timer expiry
- Results: green/red highlighting, explanations, weak area detection
- Save to `quiz_attempts`

#### [NEW] `src/app/student/classes/page.jsx`
- **Join Class** form (Class ID + Password)
- List of enrolled classes
- For each class: see active quizzes, attempt quizzes

#### [NEW] `src/app/student/classes/[classId]/page.jsx`
- Class detail: name, teacher, available quizzes
- Click quiz → attempt it (same quiz UI as practice)

#### [NEW] `src/app/student/classes/[classId]/quiz/[quizId]/page.jsx`
- Classroom quiz interface (similar to practice but quiz loaded from DB)
- Timer, answer selection, submit
- Save attempt to `quiz_attempts`

#### [NEW] `src/app/student/quiz-history/page.jsx`
- Refactored from existing `quiz-history/page.jsx`
- Shows both self-practice and classroom quiz history
- Filter by type, field, date
- Detail view with Q&A review

#### [NEW] `src/app/student/roadmaps/page.jsx`
- Refactored from existing `roadmap/page.jsx`
- View saved roadmaps
- Generate new roadmap from quiz results or manual topic

---

### Phase 7: Teacher Module Pages

#### [NEW] `src/app/teacher/classes/page.jsx`
- List all classes created by teacher
- **Create Class** button → modal/form (class name, description, password)
- System generates unique class code

#### [NEW] `src/app/teacher/classes/[classId]/page.jsx`
- Class detail page with tabs:
  - **Students**: list of enrolled students
  - **Quizzes**: list of quizzes for this class
  - **Create Quiz**: generate AI quiz for this class

#### [NEW] `src/app/teacher/classes/[classId]/create-quiz/page.jsx`
- Enter topic and difficulty
- AI generates 20 MCQs with explanations
- Teacher reviews generated questions
- Save quiz (draft) or Publish quiz (active)

#### [NEW] `src/app/teacher/classes/[classId]/quiz/[quizId]/page.jsx`
- Quiz detail: view questions, see student attempts
- **Student Performance Table**: student name, score, time taken
- Click student → see their individual answers

#### [NEW] `src/app/teacher/classes/[classId]/quiz/[quizId]/student/[studentId]/page.jsx`
- Individual student quiz review
- Show each question, student's answer, correct answer, explanation

---

### Phase 8: Admin Module Pages

#### [NEW] `src/app/admin/topics/page.jsx`
- CRUD for topics: list, add, edit, delete
- Each topic expandable to show subtopics
- CRUD for subtopics: add, edit, delete under a topic

#### [NEW] `src/app/admin/users/page.jsx`
- List all users with search/filter by role
- For each user: view profile, change password, delete account
- Confirmation dialogs for destructive actions

---

### Shared Components

#### [NEW] `src/components/Navbar.jsx`
- Responsive top navigation bar
- Shows user name, role badge, navigation links (role-specific)
- Logout button

#### [NEW] `src/components/QuizInterface.jsx`
- Shared quiz-taking component used by both self-practice and classroom modes
- Props: questions, timerMinutes, onSubmit
- Timer with auto-submit
- Question display, option selection
- Progress bar

#### [NEW] `src/components/QuizResults.jsx`
- Shared results display component
- Score card, strong/weak areas, Q&A review with green/red highlighting
- Used after both self-practice and classroom quizzes

#### [NEW] `src/components/Sidebar.jsx`
- Side navigation for dashboards (role-specific links)

---

### Page Updates

#### [MODIFY] [layout.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/layout.jsx)
- Update AuthProvider to use Supabase
- Add Inter font from Google Fonts
- Update metadata

#### [MODIFY] [page.jsx (landing)](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/page.jsx)
- Update to reflect new multi-role system
- Add features section showing Student, Teacher, Admin capabilities
- Premium landing page design

#### [MODIFY] [globals.css](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/globals.css)
- Enhanced design system with premium color palette
- Add more component classes

#### [DELETE] [profile/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/profile/page.jsx) (merged into role dashboards)
#### [DELETE] [quiz/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/quiz/page.jsx) (refactored into `/student/practice`)
#### [DELETE] [quiz-history/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/quiz-history/page.jsx) (refactored into `/student/quiz-history`)
#### [DELETE] [roadmap/page.jsx](file:///c:/Users/saifu/OneDrive/Desktop/Capston/V1/AI-Powered-Adaptive-Learning%20-%20Authentication/src/app/roadmap/page.jsx) (refactored into `/student/roadmaps`)

---

## File Summary

| Action | Count | Files |
|--------|-------|-------|
| NEW | ~25 | Supabase lib, DB lib, components, student/teacher/admin pages, SQL schema |
| MODIFY | ~8 | package.json, .env.local, globals.css, layout, landing, login, register, gemini.js |
| DELETE | ~6 | firebase.js, firestore.js, old quiz/roadmap/history/profile pages |

---

## Open Questions

> [!IMPORTANT]
> 1. **Supabase Project**: Do you already have a Supabase project created? If so, please share the URL and anon key. If not, I can guide you through setup.

> [!IMPORTANT]
> 2. **Google OAuth**: The existing app has Google sign-in. Should we keep Google OAuth (configurable in Supabase) or remove it for now?

> [!IMPORTANT]
> 3. **Topics Source**: Currently, topics/subtopics are hardcoded in the quiz page (`FIELDS` object). With the admin panel managing topics in the DB, should we:
>    - (A) Seed the DB with the existing hardcoded topics and remove the hardcoded list?
>    - (B) Keep the hardcoded list as fallback and also allow admin-managed topics?

> [!IMPORTANT]
> 4. **Quiz Question Count**: The SRS says 20 MCQs but the existing code generates 25. Should I change to 20 as per SRS?

---

## Verification Plan

### Automated Tests
- `npm run build` — ensure no build errors
- `npm run dev` — verify dev server runs

### Manual Verification
1. **Registration**: Register as Student and Teacher, verify role stored in Supabase
2. **Login**: Login with both roles, verify redirect to correct dashboard
3. **Self-Practice**: Student takes a practice quiz, verify timer, submit, results, saving
4. **Classroom Flow**: Teacher creates class → Student joins → Teacher creates quiz → Student takes quiz → Teacher views results
5. **Admin Panel**: Admin manages topics/subtopics, changes password, deletes user
6. **AI Integration**: Verify Gemini quiz generation and roadmap generation still work
7. **UI/UX**: Verify responsive design, animations, premium aesthetics on mobile and desktop
