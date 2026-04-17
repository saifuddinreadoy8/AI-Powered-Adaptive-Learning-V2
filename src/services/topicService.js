import { supabase } from '../lib/supabase'

export async function getTopics() {
  const { data, error } = await supabase
    .from('topics')
    .select('*, subtopics(*)')
    .order('topic_name')
  if (error) { console.error('getTopics:', error.message); return [] }
  return data
}

export async function getTopicById(topicId) {
  const { data, error } = await supabase
    .from('topics')
    .select('*, subtopics(*)')
    .eq('id', topicId)
    .single()
  if (error) { console.error('getTopicById:', error.message); return null }
  return data
}

export async function addTopic(topicName, icon = '📚') {
  // Get current session to ensure auth token is fresh for RLS
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.error('addTopic: No active session')
    return null
  }

  const { data, error } = await supabase
    .from('topics')
    .insert({ topic_name: topicName, icon, created_by: session.user.id })
    .select()
    .single()
  if (error) { console.error('addTopic:', error.message); return null }
  return data
}

export async function updateTopic(topicId, updates) {
  const { data, error } = await supabase
    .from('topics')
    .update(updates)
    .eq('id', topicId)
    .select()
    .single()
  if (error) { console.error('updateTopic:', error.message); return null }
  return data
}

export async function deleteTopic(topicId) {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
  if (error) { console.error('deleteTopic:', error.message); return false }
  return true
}

export async function addSubtopic(topicId, subtopicName) {
  const { data, error } = await supabase
    .from('subtopics')
    .insert({ topic_id: topicId, subtopic_name: subtopicName })
    .select()
    .single()
  if (error) { console.error('addSubtopic:', error.message); return null }
  return data
}

export async function updateSubtopic(subtopicId, updates) {
  const { data, error } = await supabase
    .from('subtopics')
    .update(updates)
    .eq('id', subtopicId)
    .select()
    .single()
  if (error) { console.error('updateSubtopic:', error.message); return null }
  return data
}

export async function deleteSubtopic(subtopicId) {
  const { error } = await supabase
    .from('subtopics')
    .delete()
    .eq('id', subtopicId)
  if (error) { console.error('deleteSubtopic:', error.message); return false }
  return true
}
