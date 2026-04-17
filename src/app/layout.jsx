import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import ChatbotWrapper from '@/components/ChatbotWrapper'

export const metadata = {
  title: 'AI Learning Companion — Adaptive Quiz & Classroom Platform',
  description: 'AI-powered adaptive learning platform with self-practice quizzes, classroom management, weak area detection, and personalized learning roadmaps.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <ChatbotWrapper />
        </AuthProvider>
      </body>
    </html>
  )
}