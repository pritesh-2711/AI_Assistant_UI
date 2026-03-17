import { useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import styles from './ChatPage.module.css'

export default function ChatPage() {
  const loadSessions = useChatStore((s) => s.loadSessions)
  const reset = useChatStore((s) => s.reset)
  const signout = useAuthStore((s) => s.signout)

  useEffect(() => {
    loadSessions()
    return () => reset()
  }, [loadSessions, reset])

  const handleSignout = async () => {
    reset()
    await signout()
  }

  return (
    <div className={styles.root}>
      <Sidebar onSignout={handleSignout} />
      <main className={styles.main}>
        <ChatArea />
      </main>
    </div>
  )
}