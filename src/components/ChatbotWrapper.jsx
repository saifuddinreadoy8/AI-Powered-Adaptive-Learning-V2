"use client"
import dynamic from 'next/dynamic'

// Dynamic import to prevent SSR issues since Chatbot uses browser APIs
const Chatbot = dynamic(() => import('./Chatbot'), { ssr: false })

export default function ChatbotWrapper() {
  return <Chatbot />
}
