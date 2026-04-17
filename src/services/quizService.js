import { supabase } from '../lib/supabase'

export async function createQuiz(quizData, questions) {
  // 1. Insert quiz
  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .insert({
      title: quizData.title || 'Untitled Quiz',
      quiz_type: quizData.quizType || 'self_practice',
      class_id: quizData.classId || null,
      topic: quizData.topic || '',
      subtopic: quizData.subtopic || '',
      difficulty: quizData.difficulty || 'Medium',
      creator_id: quizData.creatorId,
      timer_minutes: quizData.timerMinutes || 20,
      is_published: quizData.isPublished || false,
    })
    .select()
    .single()

  if (quizErr) { console.error('createQuiz:', quizErr.message); return null }

  // 2. Insert questions one batch at a time to avoid RLS check race conditions
  if (questions && questions.length > 0) {
    const questionRows = questions.map((q, i) => ({
      quiz_id: quiz.id,
      question_index: i,
      question_text: q.question || q.question_text || '',
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.answer || q.correct_answer || '',
      explanation: q.explanation || '',
      subtopic: q.subtopic || '',
    }))

    // Small delay to ensure quiz row is committed and visible to RLS
    await new Promise(r => setTimeout(r, 500))

    const { error: qErr } = await supabase
      .from('questions')
      .insert(questionRows)

    if (qErr) {
      console.error('createQuiz questions insert error:', qErr.message)
      // Retry once after a longer delay
      await new Promise(r => setTimeout(r, 1000))
      const { error: retryErr } = await supabase
        .from('questions')
        .insert(questionRows)
      if (retryErr) {
        console.error('createQuiz questions retry failed:', retryErr.message)
      }
    }
  }

  return quiz
}

export async function getQuizById(quizId) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()
  if (error) { console.error('getQuizById:', error.message); return null }
  return data
}

export async function publishQuiz(quizId) {
  const { data, error } = await supabase
    .from('quizzes')
    .update({ is_published: true })
    .eq('id', quizId)
    .select()
    .single()
  if (error) { console.error('publishQuiz:', error.message); return null }
  return data
}

export async function unpublishQuiz(quizId) {
  const { data, error } = await supabase
    .from('quizzes')
    .update({ is_published: false })
    .eq('id', quizId)
    .select()
    .single()
  if (error) { console.error('unpublishQuiz:', error.message); return null }
  return data
}

export async function getClassQuizzes(classId) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_attempts(count)')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getClassQuizzes:', error.message); return [] }
  return data
}

export async function deleteQuiz(quizId) {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
  if (error) { console.error('deleteQuiz:', error.message); return false }
  return true
}
