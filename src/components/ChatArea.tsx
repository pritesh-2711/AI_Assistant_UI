import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import MessageBubble from './MessageBubble'
import styles from './ChatArea.module.css'

export default function ChatArea() {
  const { messages, sending, error, activeSessionId, loadingMessages, sendMessage, clearError } =
    useChatStore()
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }

  if (!activeSessionId) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyInner}>
          <span className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect
                x="4"
                y="6"
                width="24"
                height="18"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 13h12M10 18h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <p className={styles.emptyTitle}>No session selected</p>
          <p className={styles.emptyHint}>Create a new session from the sidebar to start chatting.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.messages}>
        {loadingMessages && (
          <div className={styles.loadingRow}>
            <span className={styles.spinner} />
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className={styles.startHint}>
            <p>Start the conversation</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.chat_id}
            message={msg.message}
            sender={msg.sender}
            createdAt={msg.created_at}
            userName={user?.name ?? 'You'}
          />
        ))}

        {sending && (
          <div className={styles.thinking}>
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingDot} />
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={clearError}>✕</button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrap}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={sending}
          />
          <button
            className={`${styles.sendBtn} ${!input.trim() || sending ? styles.sendBtnDisabled : ''}`}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            title="Send"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8h12M9 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className={styles.hint}>Shift+Enter for newline</p>
      </div>
    </div>
  )
}
