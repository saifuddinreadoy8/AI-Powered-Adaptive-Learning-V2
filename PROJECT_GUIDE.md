# 🎓 AI Adaptive Learning - Project Guide

This document explains what each part of your project does in simple words.

## 📂 Folder Structure

### 1. `src/app/` — **The "Pages"**
This is where all the screens of your website live. It is divided by user roles:
- **`admin/`**: Screens for managing topics and viewing all users.
- **`teacher/`**: Screens for teachers to manage their classes and students.
- **`student/`**: Screens for students to take quizzes, see their history, and get roadmaps.
- **`login/` & `register/`**: Entry points for users to sign in.
- **`globals.css`**: The "Styling" file. It makes the website look premium with colors and fonts.

### 2. `src/components/` — **The "Blocks"**
These are small, reusable pieces used across different pages:
- **`Navbar.jsx`**: The navigation bar at the top of every page.
- **`quiz/`**: Specific blocks for the quiz, like the question card and the result card.

### 3. `src/services/` — **The "Messengers"**
These files talk to your database (Supabase). Whenever you save a quiz result or join a class, these files do the heavy lifting:
- **`attemptService.js`**: Saves and fetches quiz results.
- **`enrollmentService.js`**: Handles joining and managing classes.
- **`topicService.js`**: Handles the list of subjects like "Python" or "Biology".

### 4. `src/lib/` — **The "Core Connections"**
These are the files that connect your website to outside services:
- **`supabase.js`**: The connection to your Database.
- **`gemini.js`**: The connection to Google's AI. This is where questions and roadmaps are generated.

### 5. `src/context/` — **The "Memory"**
- **`AuthContext.jsx`**: This is the most important file for security. It remembers which user is currently logged in and what their role (Student/Teacher/Admin) is.

### 6. `src/hooks/` — **The "Special Tools"**
- **`useTimer.js`**: A specialized tool to handle the countdown during quizzes.

---

## 📄 Key Files at a Glance

| File / Folder | Role in Simple Words |
| :--- | :--- |
| `supabase_schema.sql` | The **Blueprint** of your database. It defines all tables and security rules. |
| `.env.local` | The **Vault** for your secret keys (Supabase and Gemini API keys). |
| `next.config.mjs` | The **Settings** for the website server. |
| `tailwind.config.js` | The **Design Palette** rules. |

---

## 🚀 How Data Flows
1. **The User** clicks a button on a **Page** (`src/app`).
2. The **Page** calls a **Messenger** (`src/services`).
3. The **Messenger** talks to the **Database** via the **Core Connection** (`src/lib`).
4. The **Memory** (`src/context`) ensures the user is allowed to do that action.
