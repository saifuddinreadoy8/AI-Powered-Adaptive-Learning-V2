-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  AI-Powered Adaptive Learning Companion                        ║
-- ║  Supabase Schema — Full Migration from Firebase                ║
-- ║  Run this in Supabase SQL Editor (Dashboard → SQL Editor)      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════
-- 0. EXTENSIONS
-- ══════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════
-- 1. CUSTOM TYPES
-- ══════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quiz_type AS ENUM ('self_practice', 'classroom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ══════════════════════════════════════
-- 2. PROFILES TABLE
-- ══════════════════════════════════════
-- Extends Supabase auth.users with app-specific data.
-- Every registered user gets a row here via trigger.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'student',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based queries (admin listing users by role)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


-- ══════════════════════════════════════
-- 3. TOPICS TABLE
-- ══════════════════════════════════════
-- Admin-managed list of top-level subject fields.
-- e.g., "Physics", "Computer Science", "Web Development"
CREATE TABLE IF NOT EXISTS topics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_name  TEXT NOT NULL UNIQUE,
  icon        TEXT DEFAULT '📚',          -- emoji icon for UI
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(topic_name);


-- ══════════════════════════════════════
-- 4. SUBTOPICS TABLE
-- ══════════════════════════════════════
-- Subtopics nested under topics.
-- e.g., Topic "Physics" → Subtopics: "Force & Motion", "Thermodynamics"
CREATE TABLE IF NOT EXISTS subtopics (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id       UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_name  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, subtopic_name)
);

CREATE INDEX IF NOT EXISTS idx_subtopics_topic ON subtopics(topic_id);


-- ══════════════════════════════════════
-- 5. CLASSES TABLE
-- ══════════════════════════════════════
-- Teachers create classes. Students join with class_code + password.
CREATE TABLE IF NOT EXISTS classes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name      TEXT NOT NULL,
  description     TEXT DEFAULT '',
  teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_code      TEXT NOT NULL UNIQUE,     -- 6-char alphanumeric join code
  class_password  TEXT NOT NULL,             -- plain text password set by teacher
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);


-- ══════════════════════════════════════
-- 6. ENROLLMENTS TABLE
-- ══════════════════════════════════════
-- Junction table: which students are in which classes.
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)              -- prevent duplicate enrollment
);

CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);


-- ══════════════════════════════════════
-- 7. QUIZZES TABLE
-- ══════════════════════════════════════
-- A quiz can be self_practice (student-created) or classroom (teacher-created).
-- Classroom quizzes belong to a class; self-practice quizzes do not.
CREATE TABLE IF NOT EXISTS quizzes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL DEFAULT 'Untitled Quiz',
  quiz_type       quiz_type NOT NULL DEFAULT 'self_practice',
  class_id        UUID REFERENCES classes(id) ON DELETE CASCADE,  -- NULL for self-practice
  topic           TEXT NOT NULL DEFAULT '',          -- topic name (denormalized for flexibility)
  subtopic        TEXT DEFAULT '',                   -- subtopic name
  difficulty      difficulty_level NOT NULL DEFAULT 'Medium',
  creator_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  timer_minutes   INTEGER NOT NULL DEFAULT 20,
  is_published    BOOLEAN NOT NULL DEFAULT false,   -- teacher publishes to make available
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_class ON quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_type ON quizzes(quiz_type);


-- ══════════════════════════════════════
-- 8. QUESTIONS TABLE
-- ══════════════════════════════════════
-- Individual MCQ questions belonging to a quiz.
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_index  INTEGER NOT NULL DEFAULT 0,
  question_text   TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',       -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer  TEXT NOT NULL,                     -- must match one of the options
  explanation     TEXT DEFAULT '',
  subtopic        TEXT DEFAULT '',                   -- subtopic this question covers
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);


-- ══════════════════════════════════════
-- 9. QUIZ ATTEMPTS TABLE
-- ══════════════════════════════════════
-- Records each student's attempt at a quiz (both self-practice and classroom).
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id       UUID REFERENCES quizzes(id) ON DELETE SET NULL,  -- nullable: quiz may be deleted
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL DEFAULT 0,
  total         INTEGER NOT NULL DEFAULT 0,
  percentage    NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_taken    INTEGER NOT NULL DEFAULT 0,           -- seconds
  auto_submit   BOOLEAN NOT NULL DEFAULT false,
  answers       JSONB NOT NULL DEFAULT '{}',          -- { "0": "Option A", "1": "Option C", ... }
  strong_areas  JSONB DEFAULT '[]',                   -- [{ name, correct, total, percentage }]
  weak_areas    JSONB DEFAULT '[]',                   -- [{ name, correct, total, percentage }]
  -- Denormalized fields for history display without joins
  topic         TEXT DEFAULT '',
  subtopic      TEXT DEFAULT '',
  field         TEXT DEFAULT '',                      -- legacy: maps to topic
  difficulty    TEXT DEFAULT '',
  quiz_type     TEXT DEFAULT 'self_practice',
  questions     JSONB DEFAULT '[]',                  -- Store full question data for self-practice/archival
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted ON quiz_attempts(submitted_at DESC);


-- ══════════════════════════════════════
-- 10. ROADMAPS TABLE
-- ══════════════════════════════════════
-- AI-generated learning roadmaps, optionally linked to a quiz attempt.
CREATE TABLE IF NOT EXISTS roadmaps (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_attempt_id   UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  title             TEXT DEFAULT '',
  summary           TEXT DEFAULT '',
  focus_message     TEXT DEFAULT '',
  phases            JSONB DEFAULT '[]',               -- full phase data from AI
  daily_plan        JSONB DEFAULT '{}',
  motivational_tip  TEXT DEFAULT '',
  subject           TEXT DEFAULT '',
  field             TEXT DEFAULT '',
  score             NUMERIC(5,2) DEFAULT 0,
  weak_areas        JSONB DEFAULT '[]',
  strong_areas      JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_created ON roadmaps(created_at DESC);


-- ══════════════════════════════════════════════════════════════════
-- 11. TRIGGER: Auto-create profile on user signup
-- ══════════════════════════════════════════════════════════════════
-- When a user registers via Supabase Auth, automatically insert
-- a row in profiles with the role from metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _name TEXT;
  _role user_role;
BEGIN
  -- Google OAuth puts the name in 'full_name'; email/password signup uses 'name'
  _name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    ''
  );

  -- Safely parse role — OAuth users won't have a role in metadata
  BEGIN
    _role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    _role := 'student';
  END;

  INSERT INTO public.profiles (id, name, email, role, avatar_url)
  VALUES (
    NEW.id,
    _name,
    COALESCE(NEW.email, ''),
    COALESCE(_role, 'student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;  -- prevent crash if profile already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ══════════════════════════════════════════════════════════════════
-- 12. TRIGGER: Auto-update updated_at timestamp
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON topics;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON subtopics;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subtopics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON classes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON quizzes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ══════════════════════════════════════════════════════════════════
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ══════════════════════════════════════════════════════════════════

-- ── Helper function: get current user's role ──
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ─────────────────────────────────────
-- 13a. PROFILES RLS
-- ─────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for displaying names in classes, etc.)
CREATE POLICY "Profiles: anyone can read"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Profiles: users update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile (e.g., change password scenario)
CREATE POLICY "Profiles: admin can update any"
  ON profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Admin can delete any profile
CREATE POLICY "Profiles: admin can delete any"
  ON profiles FOR DELETE
  USING (public.get_user_role() = 'admin');

-- Insert handled by trigger (SECURITY DEFINER), but allow explicit inserts
CREATE POLICY "Profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────
-- 13b. TOPICS RLS
-- ─────────────────────────────────────
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Everyone can read topics (students need them for quiz setup)
CREATE POLICY "Topics: anyone can read"
  ON topics FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Topics: admin can insert"
  ON topics FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Topics: admin can update"
  ON topics FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Topics: admin can delete"
  ON topics FOR DELETE
  USING (public.get_user_role() = 'admin');


-- ─────────────────────────────────────
-- 13c. SUBTOPICS RLS
-- ─────────────────────────────────────
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;

-- Everyone can read subtopics
CREATE POLICY "Subtopics: anyone can read"
  ON subtopics FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Subtopics: admin can insert"
  ON subtopics FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Subtopics: admin can update"
  ON subtopics FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Subtopics: admin can delete"
  ON subtopics FOR DELETE
  USING (public.get_user_role() = 'admin');


-- ─────────────────────────────────────
-- 13d. CLASSES RLS
-- ─────────────────────────────────────
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Teachers can see their own classes
CREATE POLICY "Classes: teacher sees own"
  ON classes FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

CREATE POLICY "Classes: enrolled students can see"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = classes.id
        AND enrollments.student_id = auth.uid()
    )
  );

-- Allow anyone to lookup basic info by class code (needed for joining)
CREATE POLICY "Classes: lookup by code"
  ON classes FOR SELECT
  USING (true); 
  -- Note: Ideally we'd limit what columns are returned via an RPC instead,
  -- but enabling SELECT here is the most compatible way with current app logic.

-- Only teachers can create classes
CREATE POLICY "Classes: teacher can create"
  ON classes FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND public.get_user_role() = 'teacher'
  );

-- Teachers can update their own classes
CREATE POLICY "Classes: teacher can update own"
  ON classes FOR UPDATE
  USING (teacher_id = auth.uid());

-- Teachers can delete their own classes
CREATE POLICY "Classes: teacher can delete own"
  ON classes FOR DELETE
  USING (teacher_id = auth.uid());


-- ─────────────────────────────────────
-- 13e. ENROLLMENTS RLS
-- ─────────────────────────────────────
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Students can see their own enrollments
CREATE POLICY "Enrollments: student sees own"
  ON enrollments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can see enrollments for their classes
CREATE POLICY "Enrollments: teacher sees class enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- Admin can see all enrollments
CREATE POLICY "Enrollments: admin sees all"
  ON enrollments FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Students can enroll themselves
CREATE POLICY "Enrollments: student can enroll self"
  ON enrollments FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND public.get_user_role() = 'student'
  );

-- Students can unenroll themselves
CREATE POLICY "Enrollments: student can unenroll self"
  ON enrollments FOR DELETE
  USING (student_id = auth.uid());


-- ─────────────────────────────────────
-- 13f. QUIZZES RLS
-- ─────────────────────────────────────
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Creators can see their own quizzes
CREATE POLICY "Quizzes: creator sees own"
  ON quizzes FOR SELECT
  USING (creator_id = auth.uid());

-- Students can see published classroom quizzes for their enrolled classes
CREATE POLICY "Quizzes: student sees published class quizzes"
  ON quizzes FOR SELECT
  USING (
    quiz_type = 'classroom'
    AND is_published = true
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = quizzes.class_id
        AND enrollments.student_id = auth.uid()
    )
  );

-- Admin can see all quizzes
CREATE POLICY "Quizzes: admin sees all"
  ON quizzes FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Teachers and students can create quizzes
CREATE POLICY "Quizzes: authenticated can create"
  ON quizzes FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Creators can update their quizzes
CREATE POLICY "Quizzes: creator can update"
  ON quizzes FOR UPDATE
  USING (creator_id = auth.uid());

-- Creators can delete their quizzes
CREATE POLICY "Quizzes: creator can delete"
  ON quizzes FOR DELETE
  USING (creator_id = auth.uid());


-- ─────────────────────────────────────
-- 13g. QUESTIONS RLS
-- ─────────────────────────────────────
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Anyone who can see a quiz can see its questions
CREATE POLICY "Questions: viewable if quiz is viewable"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND (
          quizzes.creator_id = auth.uid()
          OR (
            quizzes.quiz_type = 'classroom'
            AND quizzes.is_published = true
            AND EXISTS (
              SELECT 1 FROM enrollments
              WHERE enrollments.class_id = quizzes.class_id
                AND enrollments.student_id = auth.uid()
            )
          )
          OR public.get_user_role() = 'admin'
        )
    )
  );

-- Quiz creators can insert questions
CREATE POLICY "Questions: creator can insert"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );

-- Quiz creators can update questions
CREATE POLICY "Questions: creator can update"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );

-- Quiz creators can delete questions
CREATE POLICY "Questions: creator can delete"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );


-- ─────────────────────────────────────
-- 13h. QUIZ ATTEMPTS RLS
-- ─────────────────────────────────────
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Students can see their own attempts
CREATE POLICY "Attempts: student sees own"
  ON quiz_attempts FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can see attempts for quizzes they created
CREATE POLICY "Attempts: teacher sees own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );

-- Admin can see all attempts
CREATE POLICY "Attempts: admin sees all"
  ON quiz_attempts FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Students can insert their own attempts
CREATE POLICY "Attempts: student can insert own"
  ON quiz_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());


-- ─────────────────────────────────────
-- 13i. ROADMAPS RLS
-- ─────────────────────────────────────
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Users can see their own roadmaps
CREATE POLICY "Roadmaps: user sees own"
  ON roadmaps FOR SELECT
  USING (user_id = auth.uid());

-- Admin can see all roadmaps
CREATE POLICY "Roadmaps: admin sees all"
  ON roadmaps FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Users can create their own roadmaps
CREATE POLICY "Roadmaps: user can insert own"
  ON roadmaps FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own roadmaps
CREATE POLICY "Roadmaps: user can delete own"
  ON roadmaps FOR DELETE
  USING (user_id = auth.uid());


-- ══════════════════════════════════════════════════════════════════
-- 14. SEED DATA: Default Topics & Subtopics
-- ══════════════════════════════════════════════════════════════════
-- These match the original hardcoded FIELDS object from the app.

INSERT INTO topics (topic_name, icon) VALUES
  ('Physics',           '🔭'),
  ('Chemistry',         '⚗️'),
  ('Biology',           '🧬'),
  ('Mathematics',       '📐'),
  ('Computer Science',  '💻'),
  ('Web Development',   '🌐'),
  ('Machine Learning',  '🤖'),
  ('Data Science',      '📊'),
  ('History',           '🏛️'),
  ('Geography',         '🌍'),
  ('Economics',         '💰'),
  ('Psychology',        '🧠')
ON CONFLICT (topic_name) DO NOTHING;

-- Physics subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Force & Motion'),('Energy & Work'),('Electricity & Circuits'),('Magnetism'),
          ('Waves & Sound'),('Optics & Light'),('Thermodynamics'),('Nuclear Physics')) AS s(name)
WHERE t.topic_name = 'Physics'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Chemistry subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Atomic Structure'),('Chemical Bonding'),('Acids & Bases'),('Organic Chemistry'),
          ('Thermochemistry'),('Electrochemistry'),('Periodic Table'),('Chemical Reactions')) AS s(name)
WHERE t.topic_name = 'Chemistry'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Biology subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Cell Biology'),('Genetics & DNA'),('Evolution'),('Human Anatomy'),
          ('Ecology'),('Photosynthesis'),('Nervous System'),('Reproduction')) AS s(name)
WHERE t.topic_name = 'Biology'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Mathematics subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Algebra'),('Calculus'),('Statistics'),('Geometry'),
          ('Trigonometry'),('Probability'),('Number Theory'),('Linear Algebra')) AS s(name)
WHERE t.topic_name = 'Mathematics'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Computer Science subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Algorithms'),('Data Structures'),('OOP Concepts'),('Computer Networks'),
          ('Operating Systems'),('Databases'),('Cyber Security'),('Software Engineering')) AS s(name)
WHERE t.topic_name = 'Computer Science'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Web Development subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('HTML & CSS'),('JavaScript'),('React.js'),('Node.js'),
          ('Firebase'),('REST APIs'),('Next.js'),('TypeScript')) AS s(name)
WHERE t.topic_name = 'Web Development'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Machine Learning subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Supervised Learning'),('Neural Networks'),('NLP'),('Computer Vision'),
          ('Deep Learning'),('Feature Engineering'),('Model Evaluation'),('Clustering')) AS s(name)
WHERE t.topic_name = 'Machine Learning'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Data Science subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Statistics & Probability'),('Data Visualization'),('Pandas & NumPy'),('SQL Queries'),
          ('Big Data'),('Data Cleaning'),('Exploratory Analysis'),('Business Intelligence')) AS s(name)
WHERE t.topic_name = 'Data Science'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- History subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Ancient Civilizations'),('World Wars'),('Colonial Era'),('Industrial Revolution'),
          ('Cold War'),('Islamic History'),('South Asian History'),('Modern Politics')) AS s(name)
WHERE t.topic_name = 'History'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Geography subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Physical Geography'),('Climate & Weather'),('Maps & Coordinates'),('Population Studies'),
          ('Natural Resources'),('Continents & Oceans'),('Disaster Management'),('Environmental Issues')) AS s(name)
WHERE t.topic_name = 'Geography'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Economics subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Microeconomics'),('Macroeconomics'),('Supply & Demand'),('Inflation & GDP'),
          ('International Trade'),('Banking & Finance'),('Market Structures'),('Development Economics')) AS s(name)
WHERE t.topic_name = 'Economics'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;

-- Psychology subtopics
INSERT INTO subtopics (topic_id, subtopic_name)
SELECT t.id, s.name FROM topics t,
  (VALUES ('Cognitive Psychology'),('Behavioral Theory'),('Memory & Learning'),('Human Development'),
          ('Mental Health'),('Social Psychology'),('Motivation & Emotion'),('Abnormal Psychology')) AS s(name)
WHERE t.topic_name = 'Psychology'
ON CONFLICT (topic_id, subtopic_name) DO NOTHING;


-- ══════════════════════════════════════════════════════════════════
-- 15. UTILITY FUNCTION: Generate Class Code
-- ══════════════════════════════════════════════════════════════════
-- Generates a random 6-character uppercase alphanumeric code.
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- no I/O/0/1 to avoid confusion
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;


-- ══════════════════════════════════════════════════════════════════
-- 16. RPC: Join Class Securely
-- ══════════════════════════════════════════════════════════════════
-- Handles finding class, matching password, and enrolling in one call.
-- Returns the joined class ID on success, or throws an error on failure.
CREATE OR REPLACE FUNCTION public.join_class(
  p_student_id UUID,
  p_class_code TEXT,
  p_password TEXT
)
RETURNS UUID AS $$
DECLARE
  v_class_id UUID;
  v_active BOOLEAN;
BEGIN
  -- 1. Find the class
  SELECT id, is_active INTO v_class_id, v_active
  FROM public.classes
  WHERE class_code = UPPER(TRIM(p_class_code))
    AND class_password = p_password;

  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Invalid class code or password';
  END IF;

  IF NOT v_active THEN
    RAISE EXCEPTION 'This class is no longer active';
  END IF;

  -- 2. Check if already enrolled
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE class_id = v_class_id AND student_id = p_student_id) THEN
    RETURN v_class_id; -- Already in, just return it
  END IF;

  -- 3. Enroll
  INSERT INTO public.enrollments (class_id, student_id)
  VALUES (v_class_id, p_student_id);

  RETURN v_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════════
-- DONE! Schema is ready.
-- ══════════════════════════════════════════════════════════════════
-- Next steps:
-- 1. Go to Supabase Dashboard → SQL Editor → paste and run this file
-- 2. Verify tables in Table Editor
-- 3. Set up your .env.local with SUPABASE_URL and SUPABASE_ANON_KEY
-- 4. Continue with Phase 2 (Supabase client + data access layer)
