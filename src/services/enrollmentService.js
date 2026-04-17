import { supabase } from '../lib/supabase'

export async function joinClass(studentId, classCode, classPassword) {
  // Use the join_class RPC which runs as SECURITY DEFINER to bypass RLS
  const { data, error } = await supabase
    .rpc('join_class', {
      p_student_id: studentId,
      p_class_code: classCode.toUpperCase().trim(),
      p_password: classPassword,
    })

  if (error) {
    console.error('joinClass RPC error:', error.message)
    const msg = error.message || ''
    if (msg.includes('Invalid class code or password')) {
      return { success: false, error: 'Invalid class code or password.' }
    }
    if (msg.includes('no longer active')) {
      return { success: false, error: 'This class is no longer active.' }
    }
    if (msg.includes('already') || error.code === '23505') {
      return { success: false, error: 'You are already enrolled in this class.' }
    }
    return { success: false, error: 'Failed to join class. Try again.' }
  }

  // data is the class UUID returned by the RPC
  return { success: true, classId: data }
}

export async function getStudentClasses(studentId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, classes(*, profiles:teacher_id(name))')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false })
  if (error) { console.error('getStudentClasses:', error.message); return [] }
  return data
}

export async function getClassStudents(classId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles(id, name, email)')
    .eq('class_id', classId)
    .order('enrolled_at', { ascending: true })
  if (error) { console.error('getClassStudents:', error.message); return [] }
  return data
}

export async function unenrollStudent(enrollmentId) {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId)
  if (error) { console.error('unenrollStudent:', error.message); return false }
  return true
}
