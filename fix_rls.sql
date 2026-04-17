-- ══════════════════════════════════════════════════════════════════
-- FIX SCRIPT: Resolve 3 issues
-- 1) Student can't join class
-- 2) Teacher can't create questions
-- 3) Admin can't add topics
-- 
-- This script only creates/replaces functions and RLS policies.
-- It does NOT modify any table structures.
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────
-- 1. Ensure get_user_role() helper exists
-- ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;

-- ──────────────────────────────────────
-- 2. Ensure join_class RPC exists (SECURITY DEFINER bypasses RLS)
-- ──────────────────────────────────────
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
  -- Find the class
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

  -- Already enrolled? Just return the class ID
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE class_id = v_class_id AND student_id = p_student_id) THEN
    RETURN v_class_id;
  END IF;

  -- Enroll
  INSERT INTO public.enrollments (class_id, student_id)
  VALUES (v_class_id, p_student_id);

  RETURN v_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.join_class(UUID, TEXT, TEXT) TO anon, authenticated;

-- ──────────────────────────────────────
-- 3. Enable RLS on all relevant tables (safe to re-run)
-- ──────────────────────────────────────
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────
-- 4. FIX: Topics RLS (Admin can't add topics)
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "Topics: anyone can read" ON topics;
CREATE POLICY "Topics: anyone can read"
  ON topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Topics: admin can insert" ON topics;
CREATE POLICY "Topics: admin can insert"
  ON topics FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Topics: admin can update" ON topics;
CREATE POLICY "Topics: admin can update"
  ON topics FOR UPDATE
  USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Topics: admin can delete" ON topics;
CREATE POLICY "Topics: admin can delete"
  ON topics FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ──────────────────────────────────────
-- 5. FIX: Subtopics RLS (same as topics)
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "Subtopics: anyone can read" ON subtopics;
CREATE POLICY "Subtopics: anyone can read"
  ON subtopics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Subtopics: admin can insert" ON subtopics;
CREATE POLICY "Subtopics: admin can insert"
  ON subtopics FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Subtopics: admin can update" ON subtopics;
CREATE POLICY "Subtopics: admin can update"
  ON subtopics FOR UPDATE
  USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Subtopics: admin can delete" ON subtopics;
CREATE POLICY "Subtopics: admin can delete"
  ON subtopics FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ──────────────────────────────────────
-- 6. FIX: Classes RLS (teacher create)
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "Classes: lookup by code" ON classes;
CREATE POLICY "Classes: lookup by code"
  ON classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Classes: teacher can create" ON classes;
CREATE POLICY "Classes: teacher can create"
  ON classes FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND public.get_user_role() = 'teacher'
  );

DROP POLICY IF EXISTS "Classes: teacher can update own" ON classes;
CREATE POLICY "Classes: teacher can update own"
  ON classes FOR UPDATE
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Classes: teacher can delete own" ON classes;
CREATE POLICY "Classes: teacher can delete own"
  ON classes FOR DELETE
  USING (teacher_id = auth.uid());

-- ──────────────────────────────────────
-- 7. FIX: Enrollments RLS
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "Enrollments: student sees own" ON enrollments;
CREATE POLICY "Enrollments: student sees own"
  ON enrollments FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Enrollments: teacher sees class enrollments" ON enrollments;
CREATE POLICY "Enrollments: teacher sees class enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enrollments: admin sees all" ON enrollments;
CREATE POLICY "Enrollments: admin sees all"
  ON enrollments FOR SELECT
  USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Enrollments: student can enroll self" ON enrollments;
CREATE POLICY "Enrollments: student can enroll self"
  ON enrollments FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND public.get_user_role() = 'student'
  );

DROP POLICY IF EXISTS "Enrollments: student can unenroll self" ON enrollments;
CREATE POLICY "Enrollments: student can unenroll self"
  ON enrollments FOR DELETE
  USING (student_id = auth.uid());

-- ──────────────────────────────────────
-- 8. FIX: Quizzes RLS (teacher/student create)
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "Quizzes: creator sees own" ON quizzes;
CREATE POLICY "Quizzes: creator sees own"
  ON quizzes FOR SELECT
  USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Quizzes: student sees published class quizzes" ON quizzes;
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

DROP POLICY IF EXISTS "Quizzes: admin sees all" ON quizzes;
CREATE POLICY "Quizzes: admin sees all"
  ON quizzes FOR SELECT
  USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Quizzes: authenticated can create" ON quizzes;
CREATE POLICY "Quizzes: authenticated can create"
  ON quizzes FOR INSERT
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Quizzes: creator can update" ON quizzes;
CREATE POLICY "Quizzes: creator can update"
  ON quizzes FOR UPDATE
  USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Quizzes: creator can delete" ON quizzes;
CREATE POLICY "Quizzes: creator can delete"
  ON quizzes FOR DELETE
  USING (creator_id = auth.uid());

-- ──────────────────────────────────────
-- 9. FIX: Questions RLS (teacher can't create questions)
-- ──────────────────────────────────────
DROP POLICY IF EXISTS "Questions: viewable if quiz is viewable" ON questions;
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

DROP POLICY IF EXISTS "Questions: creator can insert" ON questions;
CREATE POLICY "Questions: creator can insert"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Questions: creator can update" ON questions;
CREATE POLICY "Questions: creator can update"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Questions: creator can delete" ON questions;
CREATE POLICY "Questions: creator can delete"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
        AND quizzes.creator_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- DONE! All 3 issues should now be fixed.
-- ══════════════════════════════════════════════════════════════════
