import { supabase } from '../lib/supabase'

export async function createClass(teacherId, className, description, classPassword) {
  // Generate a unique class code
  const classCode = generateClassCode()
  const { data, error } = await supabase
    .from('classes')
    .insert({
      class_name: className,
      description: description || '',
      teacher_id: teacherId,
      class_code: classCode,
      class_password: classPassword,
    })
    .select()
    .single()
  if (error) {
    // If code collision, retry once
    if (error.code === '23505') {
      const retryCode = generateClassCode()
      const { data: d2, error: e2 } = await supabase
        .from('classes')
        .insert({
          class_name: className,
          description: description || '',
          teacher_id: teacherId,
          class_code: retryCode,
          class_password: classPassword,
        })
        .select()
        .single()
      if (e2) { console.error('createClass retry:', e2.message); return null }
      return d2
    }
    console.error('createClass:', error.message); return null
  }
  return data
}

function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function getTeacherClasses(teacherId) {
  const { data, error } = await supabase
    .from('classes')
    .select('*, enrollments(count)')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getTeacherClasses:', error.message); return [] }
  return data
}

export async function getClassById(classId) {
  const { data, error } = await supabase
    .from('classes')
    .select('*, profiles!classes_teacher_id_fkey(name, email)')
    .eq('id', classId)
    .single()
  if (error) { console.error('getClassById:', error.message); return null }
  return data
}

export async function updateClass(classId, updates) {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .select()
    .single()
  if (error) { console.error('updateClass:', error.message); return null }
  return data
}

export async function deleteClass(classId) {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)
  if (error) { console.error('deleteClass:', error.message); return false }
  return true
}
