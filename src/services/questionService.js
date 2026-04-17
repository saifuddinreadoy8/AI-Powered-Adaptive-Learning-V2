import { supabase } from '../lib/supabase'

export async function getQuizQuestions(quizId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('question_index', { ascending: true })
  if (error) { console.error('getQuizQuestions:', error.message); return [] }
  return data
}

export async function updateQuestion(questionId, updates) {
  const { data, error } = await supabase
    .from('questions')
    .update({
      question_text: updates.question_text,
      options: updates.options,
      correct_answer: updates.correct_answer,
      explanation: updates.explanation,
      subtopic: updates.subtopic || '',
    })
    .eq('id', questionId)
    .select()
    .single()
  if (error) { console.error('updateQuestion:', error.message); return null }
  return data
}

export async function deleteQuestion(questionId) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
  if (error) { console.error('deleteQuestion:', error.message); return false }
  return true
}
