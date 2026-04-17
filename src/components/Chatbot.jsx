"use client"
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const CHATBOT_API_KEY = process.env.NEXT_PUBLIC_GEMINI_CHATBOT_KEY
const FALLBACK_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const CHATBOT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// System prompt that teaches the bot about the platform
function getSystemPrompt(role, name) {
  return `You are "AI Learning Assistant", a friendly and helpful chatbot embedded inside an AI-Powered Adaptive Learning Platform. Your job is to help users navigate the app and answer their questions about how to use it.

Current user: ${name} (Role: ${role})

## Platform Overview
This is an AI-powered adaptive learning platform with 3 roles: Student, Teacher, and Admin.

## Student Features (role: student)
- **Dashboard** (/student/dashboard): Overview of stats, recent quizzes, performance summary
- **Practice Quiz** (/student/practice): Self-practice mode — select a topic, subtopic, and difficulty, then AI generates 20 MCQ questions. After completing, you see your score, weak/strong areas, and can generate a learning roadmap.
- **My Classes** (/student/classes): Join teacher-created classes using a class code. Take quizzes assigned by teachers.
- **Quiz History** (/student/quiz-history): View all past quiz attempts with scores and details
- **Roadmaps** (/student/roadmaps): View AI-generated personalized learning roadmaps based on your weak areas

## Teacher Features (role: teacher)
- **Dashboard** (/teacher/dashboard): Overview of classes and student performance
- **My Classes** (/teacher/classes): Create classes, generate class codes for students to join, create AI-generated quizzes for students, view student scores and analytics

## Admin Features (role: admin)
- **Dashboard** (/admin/dashboard): Platform-wide overview
- **Topics** (/admin/topics): Manage topics and subtopics available for quiz generation
- **Users** (/admin/users): Manage all user accounts

## How Quiz Generation Works
1. Select a topic and subtopic (managed by admins)
2. Choose difficulty: Easy, Medium, or Hard
3. AI (Gemini) generates exactly 20 MCQ questions
4. Answer all questions, then see results with explanations
5. AI analyzes your performance and identifies weak/strong areas
6. You can generate a personalized learning roadmap based on results

## How to Join a Class (Students)
1. Go to My Classes page
2. Click "Join Class"
3. Enter the class code provided by your teacher
4. You'll see the class and any quizzes the teacher creates

## How to Create a Quiz (Teachers)
1. Go to My Classes
2. Select or create a class
3. Click "Create Quiz"
4. Choose topic, subtopic, and difficulty
5. AI generates the quiz for your students

## Important Rules for Your Responses:
1. Be concise and helpful — keep answers short (2-4 sentences max unless they ask for detail)
2. If the user asks how to do something, give step-by-step instructions
3. If you don't know something specific about the platform, say so honestly
4. Use emojis sparingly to be friendly
5. Never make up features that don't exist
6. If asked about non-platform topics, politely redirect: "I'm here to help you use the AI Learning platform! For that question, I'd suggest using a search engine."
7. Format responses in plain text, not markdown (no ** or ## etc)`
}

export default function Chatbot() {
  const { user, profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && profile) {
      const name = profile.name || user?.email?.split('@')[0] || 'there'
      setMessages([{
        role: 'assistant',
        content: `Hi ${name}! 👋 I'm your AI Learning Assistant. I can help you navigate the platform, explain features, or answer questions about how things work. What would you like to know?`
      }])
    }
  }, [isOpen, profile])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const role = profile?.role || 'student'
      const name = profile?.name || user?.email?.split('@')[0] || 'User'
      const systemPrompt = getSystemPrompt(role, name)

      // Build conversation history for context (last 10 messages)
      const recentMessages = [...messages.slice(-10), userMsg]
      const conversationText = recentMessages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')

      const prompt = `${systemPrompt}\n\n## Conversation:\n${conversationText}\n\nAssistant:`

      const requestBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      })

      // Try chatbot key first, then fallback to primary key
      const keysToTry = [CHATBOT_API_KEY, FALLBACK_API_KEY].filter(Boolean)
      let lastError = null

      for (const apiKey of keysToTry) {
        // Retry up to 2 times per key for 429/503 errors
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(`${CHATBOT_URL}?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: requestBody,
            })

            if (res.status === 429 || res.status === 503) {
              const delay = Math.pow(2, attempt + 1) * 1000
              console.warn(`Chatbot API ${res.status}, retrying in ${delay/1000}s (attempt ${attempt + 1}/3)`)
              await new Promise(r => setTimeout(r, delay))
              continue
            }

            if (!res.ok) {
              const errText = await res.text()
              console.error(`Chatbot API error ${res.status}:`, errText)
              lastError = new Error(`API Error: ${res.status}`)
              break // Try next key
            }

            const data = await res.json()
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (reply) {
              setMessages(prev => [...prev, { role: 'assistant', content: reply.trim() }])
              return // Success — exit
            }
            lastError = new Error('Empty AI response')
            break // Try next key
          } catch (fetchErr) {
            lastError = fetchErr
            break // Try next key
          }
        }
      }

      // All keys/retries failed
      throw lastError || new Error('All API keys failed')
    } catch (err) {
      console.error('Chatbot error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! I'm having trouble connecting right now. Please try again in a moment. 🔄"
      }])
    } finally {
      setLoading(false)
    }
  }

  // Don't render if no user is logged in
  if (!user || !profile) return null

  return (
    <>
      {/* ═══════════════════════════════════ */}
      {/* FLOATING CHAT BUTTON              */}
      {/* ═══════════════════════════════════ */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setHasNewMessage(false) }}
          className="chatbot-fab"
          aria-label="Open AI Assistant"
          id="chatbot-toggle"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {hasNewMessage && <span className="chatbot-fab-badge" />}
        </button>
      )}

      {/* ═══════════════════════════════════ */}
      {/* CHAT WINDOW                        */}
      {/* ═══════════════════════════════════ */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <span>🤖</span>
              </div>
              <div>
                <h3 className="chatbot-title">AI Assistant</h3>
                <span className="chatbot-status">
                  <span className="chatbot-status-dot" />
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close"
              aria-label="Close chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.role === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-bot'}`}>
                {msg.role === 'assistant' && (
                  <div className="chatbot-msg-avatar">🤖</div>
                )}
                <div className={`chatbot-msg-bubble ${msg.role === 'user' ? 'chatbot-bubble-user' : 'chatbot-bubble-bot'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-bubble-bot chatbot-typing">
                  <span className="chatbot-dot" />
                  <span className="chatbot-dot" />
                  <span className="chatbot-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="chatbot-quick-actions">
              {[
                profile.role === 'student' ? '📝 How do I take a practice quiz?' : null,
                profile.role === 'student' ? '🏫 How to join a class?' : null,
                profile.role === 'teacher' ? '📝 How to create a quiz?' : null,
                profile.role === 'teacher' ? '🏫 How to create a class?' : null,
                profile.role === 'admin' ? '📚 How to manage topics?' : null,
                '🗺️ What features are available?',
              ].filter(Boolean).map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(q.replace(/^[^\s]+\s/, ''))
                    setTimeout(() => {
                      const form = document.getElementById('chatbot-form')
                      if (form) form.requestSubmit()
                    }, 50)
                  }}
                  className="chatbot-quick-btn"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form id="chatbot-form" onSubmit={sendMessage} className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything about the platform..."
              className="chatbot-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="chatbot-send"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
