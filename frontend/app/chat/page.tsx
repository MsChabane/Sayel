import { ChatInterface } from '@/components/chat/ChatInterface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'استبيان المشروع | مساعد العملاء',
  description: 'أجب على أسئلة بسيطة حول مشروعك',
}

export default function ChatPage() {
  return <ChatInterface />
}