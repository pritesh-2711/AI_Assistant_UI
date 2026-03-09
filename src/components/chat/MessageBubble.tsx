import { useState } from 'react';
import { Copy, Check, User } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 animate-slide-up">
        <div className="max-w-[75%]">
          <div className="bg-brand px-4 py-3 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed">
            {message.message}
          </div>
          <p className="text-ink-muted text-xs mt-1 text-right">{formatTime(message.created_at)}</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center flex-shrink-0 mt-1">
          <User size={13} className="text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-slide-up">
      {/* Assistant avatar */}
      <div className="w-7 h-7 rounded-full bg-surface-card border border-surface-border flex items-center justify-center flex-shrink-0 mt-1">
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <path d="M4 8C4 5.79 5.79 4 8 4h12c2.21 0 4 1.79 4 4v8c0 2.21-1.79 4-4 4h-4l-4 4v-4H8c-2.21 0-4-1.79-4-4V8z" fill="#5B6EF5" fillOpacity="0.4" stroke="#5B6EF5" strokeWidth="1.5"/>
          <circle cx="10" cy="12" r="1.2" fill="#818CF8"/>
          <circle cx="14" cy="12" r="1.2" fill="#818CF8"/>
          <circle cx="18" cy="12" r="1.2" fill="#818CF8"/>
        </svg>
      </div>

      <div className="max-w-[75%] flex-1">
        <div className="bg-surface-card border border-surface-border px-4 py-3 rounded-2xl rounded-tl-sm group relative">
          <div
            className="text-ink-primary text-sm leading-relaxed message-content whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(message.message) }}
          />
          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 p-1.5 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-surface-overlay opacity-0 group-hover:opacity-100 transition-all"
            title="Copy message"
          >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          </button>
        </div>
        <p className="text-ink-muted text-xs mt-1 ml-1">{formatTime(message.created_at)}</p>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-surface-card border border-surface-border flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <path d="M4 8C4 5.79 5.79 4 8 4h12c2.21 0 4 1.79 4 4v8c0 2.21-1.79 4-4 4h-4l-4 4v-4H8c-2.21 0-4-1.79-4-4V8z" fill="#5B6EF5" fillOpacity="0.4" stroke="#5B6EF5" strokeWidth="1.5"/>
          <circle cx="10" cy="12" r="1.2" fill="#818CF8"/>
          <circle cx="14" cy="12" r="1.2" fill="#818CF8"/>
          <circle cx="18" cy="12" r="1.2" fill="#818CF8"/>
        </svg>
      </div>
      <div className="bg-surface-card border border-surface-border px-4 py-3.5 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/** Very minimal markdown formatter (bold, inline code, line breaks) */
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}
