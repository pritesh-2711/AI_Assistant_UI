/**
 * API service layer — ready to wire to the FastAPI backend.
 * All endpoints mirror the expected REST surface based on the DB schema.
 * Currently operates in DEMO MODE (localStorage-backed mock) when no backend is reachable.
 */

import type { User, Session, ChatMessage, AuthTokens } from '../types';

const BASE_URL = '/api';
const DEMO_MODE = true; // flip to false once FastAPI backend is live

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getToken = (): string | null => localStorage.getItem('access_token');

const setToken = (token: string) => localStorage.setItem('access_token', token);

export const clearToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('current_user');
};

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ─── Demo store (localStorage) ───────────────────────────────────────────────

const DEMO_USERS_KEY = 'demo_users';
const DEMO_SESSIONS_KEY = 'demo_sessions';
const DEMO_CHATS_KEY = 'demo_chats';

function uuid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function getDemoUsers(): User[] {
  return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) ?? '[]') as User[];
}
function saveDemoUsers(u: User[]) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(u));
}

function getDemoSessions(): Session[] {
  return JSON.parse(localStorage.getItem(DEMO_SESSIONS_KEY) ?? '[]') as Session[];
}
function saveDemoSessions(s: Session[]) {
  localStorage.setItem(DEMO_SESSIONS_KEY, JSON.stringify(s));
}

function getDemoChats(): ChatMessage[] {
  return JSON.parse(localStorage.getItem(DEMO_CHATS_KEY) ?? '[]') as ChatMessage[];
}
function saveDemoChats(c: ChatMessage[]) {
  localStorage.setItem(DEMO_CHATS_KEY, JSON.stringify(c));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(name: string, email: string, password: string): Promise<User> {
  if (DEMO_MODE) {
    const users = getDemoUsers();
    if (users.find(u => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }
    const newUser: User = { user_id: uuid(), name, email, created_at: now() };
    // store password alongside (demo only — never do this in prod)
    const record = { ...newUser, password };
    localStorage.setItem(`demo_user_${email}`, JSON.stringify(record));
    users.push(newUser);
    saveDemoUsers(users);
    return newUser;
  }

  return request<User>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signIn(email: string, password: string): Promise<{ user: User; token: string }> {
  if (DEMO_MODE) {
    const raw = localStorage.getItem(`demo_user_${email}`);
    if (!raw) throw new Error('No account found with this email.');
    const record = JSON.parse(raw) as User & { password: string };
    if (record.password !== password) throw new Error('Incorrect password.');
    const token = `demo-token-${record.user_id}`;
    setToken(token);
    const user: User = { user_id: record.user_id, name: record.name, email: record.email, created_at: record.created_at };
    localStorage.setItem('current_user', JSON.stringify(user));
    return { user, token };
  }

  const tokens = await request<AuthTokens>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(tokens.access_token);
  const user = await getMe();
  return { user, token: tokens.access_token };
}

export async function signOut(): Promise<void> {
  if (!DEMO_MODE) {
    await request('/auth/signout', { method: 'POST' }).catch(() => null);
  }
  clearToken();
}

export async function getMe(): Promise<User> {
  if (DEMO_MODE) {
    const raw = localStorage.getItem('current_user');
    if (!raw) throw new Error('Not authenticated');
    return JSON.parse(raw) as User;
  }
  return request<User>('/auth/me');
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions(userId: string): Promise<Session[]> {
  if (DEMO_MODE) {
    const sessions = getDemoSessions()
      .filter(s => s.user_id === userId && s.is_active)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Attach preview (last message snippet)
    const chats = getDemoChats();
    return sessions.map(s => {
      const msgs = chats.filter(c => c.session_id === s.session_id);
      const last = msgs[msgs.length - 1];
      return { ...s, preview: last?.message.slice(0, 60) };
    });
  }
  return request<Session[]>(`/sessions?user_id=${userId}`);
}

export async function createSession(userId: string, sessionName: string): Promise<Session> {
  if (DEMO_MODE) {
    const session: Session = {
      session_id: uuid(),
      user_id: userId,
      session_name: sessionName,
      is_active: true,
      created_at: now(),
    };
    const sessions = getDemoSessions();
    sessions.push(session);
    saveDemoSessions(sessions);
    return session;
  }
  return request<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, session_name: sessionName }),
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (DEMO_MODE) {
    const sessions = getDemoSessions().filter(s => s.session_id !== sessionId);
    saveDemoSessions(sessions);
    // cascade delete messages
    const chats = getDemoChats().filter(c => c.session_id !== sessionId);
    saveDemoChats(chats);
    return;
  }
  await request(`/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function terminateSession(sessionId: string): Promise<void> {
  if (DEMO_MODE) {
    const sessions = getDemoSessions().map(s =>
      s.session_id === sessionId ? { ...s, is_active: false, terminated_at: now() } : s
    );
    saveDemoSessions(sessions);
    return;
  }
  await request(`/sessions/${sessionId}/terminate`, { method: 'POST' });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  if (DEMO_MODE) {
    return getDemoChats()
      .filter(c => c.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  return request<ChatMessage[]>(`/sessions/${sessionId}/messages`);
}

export async function sendMessage(
  sessionId: string,
  message: string,
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  if (DEMO_MODE) {
    const userMsg: ChatMessage = {
      chat_id: uuid(),
      session_id: sessionId,
      sender: 'user',
      message,
      created_at: now(),
    };

    // Simulate assistant response
    const assistantMsg: ChatMessage = {
      chat_id: uuid(),
      session_id: sessionId,
      sender: 'assistant',
      message: getDemoResponse(message),
      created_at: now(),
    };

    const chats = getDemoChats();
    chats.push(userMsg, assistantMsg);
    saveDemoChats(chats);
    return { userMessage: userMsg, assistantMessage: assistantMsg };
  }

  const userMsg = await request<ChatMessage>(`/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ sender: 'user', message }),
  });
  const assistantMsg = await request<ChatMessage>(`/sessions/${sessionId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return { userMessage: userMsg, assistantMessage: assistantMsg };
}

function getDemoResponse(userMessage: string): string {
  const lm = userMessage.toLowerCase();
  if (lm.includes('hello') || lm.includes('hi')) {
    return "Hello! I'm your AI research assistant. Ask me anything about your documents or any topic you're researching.";
  }
  if (lm.includes('how are you')) {
    return "I'm doing great, thanks for asking! Ready to help with your research. What would you like to explore today?";
  }
  if (lm.includes('paper') || lm.includes('research')) {
    return "I can help you analyze research papers. Once document upload is enabled, you'll be able to upload PDFs and I'll help you extract key insights, summarize findings, and answer questions about the content.";
  }
  return `I've received your message: "${userMessage}"\n\nThis is a demo response. Once connected to the backend, I'll be able to provide intelligent, context-aware answers using the configured LLM provider (Ollama or OpenAI).`;
}
