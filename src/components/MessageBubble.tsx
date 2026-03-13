import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './MessageBubble.module.css'

interface Props {
  message: string
  sender: 'user' | 'assistant'
  createdAt: string
  userName: string
}

export default function MessageBubble({ message, sender, createdAt, userName }: Props) {
  const isUser = sender === 'user'

  const time = new Date(createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        <div className={styles.meta}>
          <span className={styles.sender}>{isUser ? userName : 'Assistant'}</span>
          <span className={styles.time}>{time}</span>
        </div>
        <div className={`message-content ${styles.content}`}>
          {isUser ? (
            <p>{message}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  )
}
