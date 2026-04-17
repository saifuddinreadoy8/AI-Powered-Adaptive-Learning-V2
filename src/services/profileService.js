import { supabase } from '../lib/supabase'

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) { console.error('getUserProfile:', error.message); return null }
  return data
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) { console.error('updateUserProfile:', error.message); return null }
  return data
}
