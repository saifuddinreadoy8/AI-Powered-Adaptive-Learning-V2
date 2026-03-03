import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

/* ─────────────────────────────────────────────────────────────
   generateQuiz  →  4 subtopics × 5 questions = 20 MCQs total
   Only the MOST IMPORTANT concepts are included.
───────────────────────────────────────────────────────────── */
export async function generateQuiz(subject, topic, difficulty) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are an expert educator creating a focused quiz.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Create EXACTLY 4 subtopics. For each subtopic create EXACTLY 5 MCQ questions.
Total = 20 questions. Include ONLY the most important concepts students must know.

Return ONLY valid JSON — no markdown, no backticks:
{
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "subtopics": [
    {
      "name": "Subtopic Name",
      "questions": [
        {
          "id": 1,
          "question": "Question text?",
          "options": ["A text", "B text", "C text", "D text"],
          "correctIndex": 0,
          "explanation": "Why this answer is correct. Include a short code example if programming topic."
        }
      ]
    }
  ]
}`

  const res  = await model.generateContent(prompt)
  const text = res.response.text().trim()
                 .replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'')
  return JSON.parse(text)
}

/* ─────────────────────────────────────────────────────────────
   analyzeResults  →  AI analysis + roadmap + resources
───────────────────────────────────────────────────────────── */
export async function analyzeResults(subject, topic, subtopicScores) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const lines = subtopicScores.map(s =>
    `${s.name}: ${s.correct}/${s.total} (${Math.round(s.correct/s.total*100)}%)`
  ).join('
')

  const prompt = `A student completed a quiz.
Subject: ${subject} | Topic: ${topic}

Subtopic scores:
${lines}

Analyze and return ONLY valid JSON:
{
  "overallFeedback": "2-3 sentence honest assessment",
  "strengths": ["subtopic name", "..."],
  "weakAreas": [
    {
      "subtopic": "Name",
      "reason": "Specific reason they struggled",
      "roadmap": [
        "Step 1: Start with ...",
        "Step 2: Practice ...",
        "Step 3: Build ..."
      ],
      "resources": [
        {
          "type": "YouTube",
          "title": "Descriptive video title",
          "url": "https://www.youtube.com/results?search_query=${topic}+tutorial",
          "description": "What this covers"
        },
        {
          "type": "Article",
          "title": "MDN / GeeksforGeeks article title",
          "url": "https://developer.mozilla.org",
          "description": "What this covers"
        }
      ]
    }
  ]
}
Return ONLY JSON, no markdown.`

  const res  = await model.generateContent(prompt)
  const text = res.response.text().trim()
                 .replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'')
  return JSON.parse(text)
}