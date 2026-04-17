import { supabase } from '../lib/supabase'

export async function saveRoadmap(userId, roadmapData) {
  const { data, error } = await supabase
    .from('roadmaps')
    .insert({
      user_id: userId,
      quiz_attempt_id: roadmapData.quizAttemptId || null,
      title: roadmapData.title || '',
      summary: roadmapData.summary || '',
      focus_message: roadmapData.focusMessage || roadmapData.focus_message || '',
      phases: roadmapData.phases || [],
      daily_plan: roadmapData.dailyPlan || roadmapData.daily_plan || {},
      motivational_tip: roadmapData.motivationalTip || roadmapData.motivational_tip || '',
      subject: roadmapData.subject || '',
      field: roadmapData.field || '',
      score: roadmapData.score || 0,
      weak_areas: roadmapData.weakAreas || roadmapData.weak_areas || [],
      strong_areas: roadmapData.strongAreas || roadmapData.strong_areas || [],
    })
    .select()
    .single()

  if (error) { console.error('saveRoadmap:', error.message); return null }
  return data
}

export async function getRoadmapHistory(userId) {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getRoadmapHistory:', error.message); return [] }
  return data
}

export async function getRoadmapById(roadmapId) {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', roadmapId)
    .single()
  if (error) { console.error('getRoadmapById:', error.message); return null }
  return data
}

export async function deleteRoadmap(roadmapId) {
  const { error } = await supabase
    .from('roadmaps')
    .delete()
    .eq('id', roadmapId)
  if (error) { console.error('deleteRoadmap:', error.message); return false }
  return true
}
