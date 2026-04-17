const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Helper: fetch with retry for 429 rate-limit errors
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429 && attempt < maxRetries) {
      const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.warn(`Gemini rate limited (429). Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    return res;
  }
}

async function callGemini(prompt) {
  const res = await fetchWithRetry(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`Gemini API Detail Error (${res.status}):`, txt);
    throw new Error(`Gemini API Error: ${res.status}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!raw) {
    console.error("Gemini returned empty text. Full response:", data);
    throw new Error("Empty response from AI");
  }

  // Robust parsing: extract JSON array or object
  try {
    const jsonMatch = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(raw);
  } catch (err) {
    console.error("Gemini Parse Failure. Raw Text:", raw);
    throw new Error("Failed to parse Gemini response as JSON");
  }
}

// ══════════════════════════════════════
// GENERATE 20 MCQs — Self-Practice Mode
// ══════════════════════════════════════
export async function generateFullQuiz(topic, subtopic, difficulty) {
  const prompt = `You are an expert quiz generator.
Generate exactly 20 ${difficulty} level multiple choice questions about "${subtopic}" in "${topic}".

STRICT JSON response only (no extra text):
[
  {
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Clear explanation of why this answer is correct",
    "subtopic": "Specific sub-concept inside ${subtopic}"
  }
]

Rules:
1. Exactly 20 questions
2. Exactly 4 options per question
3. answer must exactly match one of the options
4. difficulty: ${difficulty}
5. Assign a specific 'subtopic' label to each question and categorize them into 4-5 diverse categories within "${subtopic}" (e.g. for Python Loops, categorize into For Loops, While Loops, etc.) for detailed analysis.`;

  const questions = await callGemini(prompt);
  if (!Array.isArray(questions)) throw new Error("Expected JSON array from Gemini");
  return questions;
}

// ══════════════════════════════════════
// GENERATE 20 MCQs — Classroom Mode (Teacher)
// ══════════════════════════════════════
export async function generateClassroomQuiz(topic, difficulty, subtopic = '') {
  const subtopicInstruction = subtopic
    ? `Focus ALL questions specifically on "${subtopic}" within "${topic}".`
    : `Cover diverse subtopics within "${topic}".`;

  const prompt = `You are an expert quiz generator.
Generate exactly 20 ${difficulty} level MCQ questions about "${topic}"${subtopic ? ` — specifically "${subtopic}"` : ''}.

Return STRICT JSON only:
[
  {
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Clear explanation",
    "subtopic": "Specific subtopic this question covers"
  }
]

Rules:
1. Exactly 20 questions
2. Exactly 4 options per question
3. ${subtopicInstruction}`;

  const questions = await callGemini(prompt);
  if (!Array.isArray(questions)) throw new Error("Expected JSON array from Gemini");
  return questions;
}

// ══════════════════════════════════════
// ANALYZE PERFORMANCE & GENERATE ROADMAP
// ══════════════════════════════════════
export async function analyzePerformanceWithAI(topic, difficulty, subtopicAnalysis, score) {
  const prompt = `You are an expert adaptive learning coach analyzing a student's quiz performance.

Student Performance Data:
- Topic: "${topic}"
- Difficulty: ${difficulty}
- Overall Score: ${score}%
- Subtopic Analysis: ${JSON.stringify(subtopicAnalysis, null, 2)}

Provide detailed personalized analysis in STRICT JSON:
{
  "overallFeedback": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "roadmap": [
    {
      "step": 1,
      "title": "Step title",
      "description": "What to do and why",
      "duration": "Estimated time"
    }
  ],
  "resources": [
    {
      "title": "Resource title",
      "url": "https://actual-url.com",
      "type": "youtube|blog|website|documentation",
      "description": "Why this resource helps"
    }
  ]
}

Rules:
- Provide 3-5 strengths and weaknesses
- Roadmap must have 4-6 actionable steps
- Resources must include 2 YouTube, 2 blogs, 1 official doc
- URLs must be real existing URLs`;

  return callGemini(prompt);
}

// ══════════════════════════════════════
// GENERATE FULL LEARNING ROADMAP
// ══════════════════════════════════════
export async function generateRoadmapAI(subject, field, weakAreas, strongAreas, score, difficulty) {
  const weakList = weakAreas?.length > 0
    ? weakAreas.map(a => `${a.name} (${a.percentage}%)`).join(', ')
    : 'None';
  const strongList = strongAreas?.length > 0
    ? strongAreas.map(a => `${a.name} (${a.percentage}%)`).join(', ')
    : 'None';

  const prompt = `You are an expert learning coach. Generate a personalized roadmap.

Student Data:
- Field: ${field}
- Subject: ${subject}
- Difficulty: ${difficulty}
- Score: ${score}%
- Weak Areas: ${weakList}
- Strong Areas: ${strongList}

Return ONLY valid JSON:
{
  "title": "Roadmap title",
  "summary": "2 sentence summary",
  "focusMessage": "What to focus on most",
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "1-2 weeks",
      "priority": "high",
      "topics": [
        {
          "name": "Topic",
          "description": "What to study",
          "isWeak": true,
          "tips": ["Tip 1", "Tip 2"]
        }
      ],
      "resources": [
        {
          "title": "Resource",
          "type": "youtube",
          "url": "https://youtube.com",
          "description": "Why helpful"
        }
      ]
    }
  ],
  "dailyPlan": {
    "studyTime": "1-2 hours/day",
    "schedule": [
      { "day": "Day 1-2", "task": "Task description" }
    ]
  },
  "motivationalTip": "Encouragement message"
}

Rules:
- 3-4 phases total
- Phase 1 MUST target weak areas: ${weakList}
- 2-3 topics per phase
- 2-3 real resources per phase (YouTube, freeCodeCamp, MDN, GeeksforGeeks)
- 5-7 days in daily plan`;

  return callGemini(prompt);
}
