import { useState, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { Send, Loader2, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isSending, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || isSending || disabled) return;
    setValue('');
    resetHeight();
    await onSend(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const canSend = value.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="border-t border-surface-border bg-surface-raised px-4 py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-surface-card border border-surface-border rounded-2xl px-4 py-3 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/20 transition-all">
          {/* Upload (future) */}
          <button
            type="button"
            disabled
            title="Document upload coming soon"
            className="flex-shrink-0 p-1.5 rounded-lg text-ink-muted opacity-40 cursor-not-allowed mb-0.5"
          >
            <Paperclip size={17} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-ink-primary placeholder-ink-muted text-sm resize-none outline-none leading-relaxed max-h-[200px] overflow-y-auto scrollbar-hide disabled:opacity-50"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!canSend}
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 mb-0.5 ${
              canSend
                ? 'bg-brand hover:bg-brand-dim text-white shadow-lg shadow-brand/25'
                : 'bg-surface-overlay text-ink-muted cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>

        <p className="text-ink-muted text-xs text-center mt-2">
          Press <kbd className="px-1 py-0.5 bg-surface-card border border-surface-border rounded text-xs">Enter</kbd> to send &nbsp;·&nbsp;
          <kbd className="px-1 py-0.5 bg-surface-card border border-surface-border rounded text-xs">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  );
}
