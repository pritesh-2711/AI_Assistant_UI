import { create } from 'zustand'
import { chatApi, sessionsApi } from '../api/client'
import type { ChatMessageResponse, SessionResponse } from '../types/api'

interface ChatState {
  sessions: SessionResponse[]
  activeSessionId: string | null
  messages: ChatMessageResponse[]
  sending: boolean
  streamingContent: string | null  // accumulates in-flight assistant tokens
  loadingSessions: boolean
  loadingMessages: boolean
  error: string | null

  loadSessions: () => Promise<void>
  selectSession: (sessionId: string) => Promise<void>
  createSession: (name: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  terminateSession: (sessionId: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  sending: false,
  streamingContent: null,
  loadingSessions: false,
  loadingMessages: false,
  error: null,

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      sessions: [],
      activeSessionId: null,
      messages: [],
      sending: false,
      streamingContent: null,
      error: null,
    }),

  loadSessions: async () => {
    set({ loadingSessions: true, error: null })
    try {
      const sessions = await sessionsApi.list()
      set({ sessions, loadingSessions: false })

      // Auto-select the most recent active session; do NOT create one here.
      // Session creation is an explicit user action to avoid the double-POST bug.
      const active = sessions.find((s) => s.is_active)
      if (active && !get().activeSessionId) {
        await get().selectSession(active.session_id)
      }
    } catch (e) {
      set({ loadingSessions: false, error: (e as Error).message })
    }
  },

  selectSession: async (sessionId) => {
    set({ activeSessionId: sessionId, loadingMessages: true, error: null })
    try {
      const messages = await chatApi.getMessages(sessionId)
      set({ messages, loadingMessages: false })
    } catch (e) {
      set({ loadingMessages: false, error: (e as Error).message })
    }
  },

  createSession: async (name) => {
    set({ error: null })
    try {
      const session = await sessionsApi.create({ session_name: name })
      set((state) => ({ sessions: [session, ...state.sessions] }))
      await get().selectSession(session.session_id)
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await sessionsApi.delete(sessionId)
      const remaining = get().sessions.filter((s) => s.session_id !== sessionId)
      set({ sessions: remaining })
      if (get().activeSessionId === sessionId) {
        const next = remaining.find((s) => s.is_active)
        if (next) {
          await get().selectSession(next.session_id)
        } else {
          set({ activeSessionId: null, messages: [] })
        }
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  terminateSession: async (sessionId) => {
    try {
      await sessionsApi.terminate(sessionId)
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.session_id === sessionId ? { ...s, is_active: false } : s,
        ),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  sendMessage: async (text) => {
    const { activeSessionId } = get()
    if (!activeSessionId || !text.trim()) return

    // Optimistically show user message immediately
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticUserMsg: ChatMessageResponse = {
      chat_id: optimisticId,
      session_id: activeSessionId,
      sender: 'user',
      message: text,
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, optimisticUserMsg],
      sending: true,
      streamingContent: '',
      error: null,
    }))

    try {
      for await (const event of chatApi.streamMessage(activeSessionId, { message: text })) {
        if (event.type === 'user_message') {
          // Replace optimistic message with the persisted one from the backend
          set((state) => ({
            messages: state.messages.map((m) =>
              m.chat_id === optimisticId ? event : m,
            ),
          }))
        } else if (event.type === 'token') {
          set((state) => ({
            streamingContent: (state.streamingContent ?? '') + event.content,
          }))
        } else if (event.type === 'done') {
          set((state) => ({
            messages: [...state.messages, event],
            streamingContent: null,
            sending: false,
          }))
        } else if (event.type === 'error') {
          throw new Error(event.detail)
        }
      }
    } catch (e) {
      // Remove optimistic message on failure
      set((state) => ({
        messages: state.messages.filter((m) => m.chat_id !== optimisticId),
        sending: false,
        streamingContent: null,
        error: (e as Error).message,
      }))
    }
  },
}))