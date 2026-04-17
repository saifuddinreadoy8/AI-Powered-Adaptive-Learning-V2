import { supabase } from '../lib/supabase'

export async function saveQuizAttempt(attemptData) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: attemptData.quizId || null,
      student_id: attemptData.studentId,
      score: attemptData.score || 0,
      total: attemptData.total || 0,
      percentage: attemptData.percentage || 0,
      time_taken: attemptData.timeTaken || 0,
      auto_submit: attemptData.autoSubmit || false,
      answers: attemptData.answers || {},
      strong_areas: attemptData.strongAreas || [],
      weak_areas: attemptData.weakAreas || [],
      topic: attemptData.topic || '',
      subtopic: attemptData.subtopic || '',
      field: attemptData.field || '',
      difficulty: attemptData.difficulty || '',
      quiz_type: attemptData.quizType || 'self_practice',
      questions: attemptData.questions || [],
    })
    .select()
    .single()

  if (error) { console.error('saveQuizAttempt:', error.message); return null }
  return data
}

export async function getQuizHistory(studentId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
  if (error) { console.error('getQuizHistory:', error.message); return [] }
  return data
}

export async function getQuizAttemptById(attemptId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .single()
  if (error) { console.error('getQuizAttemptById:', error.message); return null }
  return data
}

export async function getQuizAttemptsByQuiz(quizId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, profiles!quiz_attempts_student_id_fkey(name, email)')
    .eq('quiz_id', quizId)
    .order('submitted_at', { ascending: false })
  if (error) { console.error('getQuizAttemptsByQuiz:', error.message); return [] }
  return data
}

export async function getClassAttempts(classId) {
  // Step 1: Get all quiz IDs belonging to this class
  const { data: quizzes, error: qErr } = await supabase
    .from('quizzes')
    .select('id')
    .eq('class_id', classId)
  if (qErr) { console.error('getClassAttempts quizzes:', qErr.message); return [] }
  const quizIds = (quizzes || []).map(q => q.id)
  if (quizIds.length === 0) return []

  // Step 2: Fetch all attempts for those quizzes
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, profiles!quiz_attempts_student_id_fkey(id, name, email)')
    .in('quiz_id', quizIds)
    .order('submitted_at', { ascending: false })
  if (error) { console.error('getClassAttempts:', error.message); return [] }
  return data || []
}

export async function getStudentAttemptForQuiz(quizId, studentId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') {
    console.error('getStudentAttemptForQuiz:', error.message)
  }
  return data || null
}
