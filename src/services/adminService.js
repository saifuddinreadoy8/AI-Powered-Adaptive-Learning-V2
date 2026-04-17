import { supabase } from '../lib/supabase'

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('getAllUsers:', error.message); return [] }
  return data
}

export async function deleteUserProfile(userId) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  if (error) { console.error('deleteUserProfile:', error.message); return false }
  return true
}

export async function updateUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single()
  if (error) { console.error('updateUserRole:', error.message); return null }
  return data
}

export async function getStudentStats(studentId) {
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('percentage, topic')
    .eq('student_id', studentId)

  if (error) { console.error('getStudentStats:', error.message); return null }

  const total = attempts.length
  const avgScore = total > 0
    ? Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / total)
    : 0
  const uniqueTopics = new Set(attempts.map(a => a.topic).filter(Boolean)).size

  return { totalQuizzes: total, avgScore, topicsCompleted: uniqueTopics }
}

export async function getTeacherStats(teacherId) {
  // Get classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)

  const classIds = classes?.map(c => c.id) || []

  // Get total enrollments
  let totalStudents = 0
  if (classIds.length > 0) {
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .in('class_id', classIds)
    totalStudents = count || 0
  }

  // Get total quizzes
  const { count: totalQuizzes } = await supabase
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', teacherId)

  return {
    totalClasses: classIds.length,
    totalStudents,
    totalQuizzes: totalQuizzes || 0,
  }
}

export async function getAdminStats() {
  const [users, topics, classes, quizzes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: users.count || 0,
    totalTopics: topics.count || 0,
    totalClasses: classes.count || 0,
    totalQuizAttempts: quizzes.count || 0,
  }
}
