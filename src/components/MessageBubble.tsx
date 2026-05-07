import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './MessageBubble.module.css'
import { MermaidDiagram } from './chat/MermaidDiagram'

function ChartCard({ b64, index }: { b64: string; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${b64}`
    a.download = `chart-${index + 1}.png`
    a.click()
  }

  const handleCopy = async () => {
    const res = await fetch(`data:image/png;base64,${b64}`)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        gap: 6,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s',
        zIndex: 10,
      }}>
        <button
          onClick={handleCopy}
          title="Copy image"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid #d1d5db', background: '#fff',
            cursor: 'pointer', color: copied ? '#16a34a' : '#6b7280', padding: 0,
          }}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
              <path d="M3 8l4 4 6-6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="5" y="5" width="9" height="9" rx="2" />
              <path d="M11 5V3a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            </svg>
          )}
        </button>
        <button
          onClick={handleDownload}
          title="Download as PNG"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid #d1d5db', background: '#fff',
            cursor: 'pointer', color: '#6b7280', padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v8M5 7l3 3 3-3" />
            <path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
          </svg>
        </button>
      </div>
      <img
        src={`data:image/png;base64,${b64}`}
        alt={`Chart ${index + 1}`}
        style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #e5e7eb', display: 'block' }}
      />
    </div>
  )
}

interface Props {
  message: string
  sender: 'user' | 'assistant'
  createdAt: string
  userName: string
  charts?: string[]
}

export default function MessageBubble({ message, sender, createdAt, userName, charts }: Props) {
  const isUser = sender === 'user'
  const hasVisuals = !isUser && (message.includes('```mermaid') || (charts && charts.length > 0))

  const time = new Date(createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant} ${hasVisuals ? styles.bubbleWide : ''}`}>
        <div className={styles.meta}>
          <span className={styles.sender}>{isUser ? userName : 'Assistant'}</span>
          <span className={styles.time}>{time}</span>
        </div>
        <div className={`message-content ${styles.content}`}>
          {isUser ? (
            <p>{message}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children }) {
                  const lang = /language-(\w+)/.exec(className || '')?.[1]
                  if (lang === 'mermaid') {
                    return <MermaidDiagram code={String(children).trim()} />
                  }
                  return <code className={className}>{children}</code>
                },
              }}
            >
              {message}
            </ReactMarkdown>
          )}
        </div>

        {/* E2B-generated chart images */}
        {!isUser && charts && charts.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {charts.map((b64, i) => (
              <ChartCard key={i} b64={b64} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
