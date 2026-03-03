import { db } from './firebase'
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'

// Save full quiz result to Firestore
export async function saveResult(userId, data) {
  return addDoc(collection(db, 'quizResults'), {
    userId,
    subject:        data.subject,
    topic:          data.topic,
    difficulty:     data.difficulty,
    score:          data.score,
    totalCorrect:   data.totalCorrect,
    totalQuestions: data.totalQuestions,
    subtopicScores: data.subtopicScores,   // per-subtopic breakdown
    weakAreas:      data.weakAreas || [],  // AI-detected weak areas
    roadmap:        data.roadmap   || [],  // AI roadmap steps
    resources:      data.resources || [],  // YouTube + article links
    createdAt: serverTimestamp(),
  })
}

// Fetch all results for a user, newest first
export async function getHistory(userId) {
  const q = query(
    collection(db, 'quizResults'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}