import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { useDocumentsStore } from '../store/documentsStore'
import MessageBubble from './MessageBubble'
import styles from './ChatArea.module.css'

export default function ChatArea() {
  const { messages, sending, streamingContent, statusContent, error, activeSessionId, loadingMessages, sendMessage, clearError } =
    useChatStore()
  const user = useAuthStore((s) => s.user)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploadFile } = useDocumentsStore()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSessionId) return
    e.target.value = ''
    await uploadFile(activeSessionId, file)
  }

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
    await sendMessage(text, mode)
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

  const [mode, setMode] = useState<'fast' | 'deep'>('fast')
  const noSession = !activeSessionId

  return (
    <div className={styles.root}>
      <div className={styles.messages}>
        {noSession ? (
          <div className={styles.emptyInner}>
            <span className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="6" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 13h12M10 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <p className={styles.emptyTitle}>No session selected</p>
            <p className={styles.emptyHint}>Create a new session from the sidebar to start chatting.</p>
          </div>
        ) : (
          <>
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

            {sending && streamingContent === '' && (
              <div className={styles.thinking}>
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
                <span className={styles.thinkingDot} />
                {mode === 'deep' && statusContent && (
                  <span key={statusContent} className={styles.thinkingStatus}>
                    {statusContent}
                  </span>
                )}
              </div>
            )}

            {streamingContent !== null && streamingContent !== '' && (
              <MessageBubble
                message={streamingContent}
                sender="assistant"
                createdAt={new Date().toISOString()}
                userName={user?.name ?? 'You'}
              />
            )}

            {error && (
              <div className={styles.errorBanner}>
                <span>{error}</span>
                <button onClick={clearError}>✕</button>
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      <div className={`${styles.inputArea} ${noSession ? styles.inputAreaDisabled : ''}`}>
        <div className={styles.inputWrap}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={noSession}
            title={noSession ? 'Create a session first' : 'Upload document (PDF or DOCX)'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 2v7M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={noSession ? 'Create a session to start chatting…' : 'Message… (Enter to send, Shift+Enter for newline)'}
            rows={1}
            disabled={sending || noSession}
          />
          <button
            className={`${styles.sendBtn} ${!input.trim() || sending || noSession ? styles.sendBtnDisabled : ''}`}
            onClick={handleSend}
            disabled={!input.trim() || sending || noSession}
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
        <div className={styles.hintRow}>
          {/* Mode toggle — Off (Fast) / On (Deep) */}
          <button
            type="button"
            disabled={noSession}
            onClick={() => setMode(m => m === 'fast' ? 'deep' : 'fast')}
            title={mode === 'fast' ? 'Fast mode — click to switch to Deep' : 'Deep mode — click to switch to Fast'}
            className={`${styles.modeToggle} ${mode === 'deep' ? styles.modeToggleDeep : ''}`}
          >
            <span className={styles.modeDot} />
            {mode === 'fast' ? 'Fast' : 'Deep'}
          </button>

          <p className={styles.hint}>Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}
