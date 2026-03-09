# Chat Assistant UI

A React frontend for the [genai-poc-to-prod](https://github.com/pritesh-2711/genai-poc-to-prod) backend — a session-based AI research chat assistant built with LangChain, PostgreSQL, and FastAPI (in progress).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | TailwindCSS (custom dark theme) |
| Routing | React Router v6 |
| Icons | lucide-react |
| State | Context API |

## Features

- **Sign Up / Sign In** — email + password auth with form validation and password strength meter
- **Session management** — new blank session on every login; empty sessions auto-deleted when switching away
- **Chat history** — previous sessions listed in sidebar, grouped by Today / Yesterday / Earlier
- **Message UI** — user bubbles, assistant cards with copy button, typing indicator
- **Empty state** — suggestion cards to kick off a conversation
- **Logout** — clears token and redirects to sign in

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo Mode

The app runs in **demo mode** by default — all data (users, sessions, messages) is stored in `localStorage`. No backend required.

To connect to the real FastAPI backend once it's available, open `src/services/api.ts` and set:

```ts
const DEMO_MODE = false;
```

## Project Structure

```
src/
├── types/            # Shared TypeScript interfaces
├── services/
│   └── api.ts        # API client (demo + real backend)
├── context/
│   ├── AuthContext.tsx
│   └── ChatContext.tsx
├── pages/
│   ├── SignIn.tsx
│   ├── SignUp.tsx
│   └── Chat.tsx
└── components/
    ├── auth/
    │   └── AuthLayout.tsx
    ├── sidebar/
    │   └── Sidebar.tsx
    └── chat/
        ├── ChatWindow.tsx
        ├── MessageBubble.tsx
        ├── ChatInput.tsx
        └── EmptyState.tsx
```

## Backend Integration

When the FastAPI backend is live, the following endpoints are expected:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login, returns JWT |
| POST | `/auth/signout` | Logout |
| GET  | `/auth/me` | Current user info |
| GET  | `/sessions` | List user sessions |
| POST | `/sessions` | Create new session |
| DELETE | `/sessions/:id` | Delete session |
| GET  | `/sessions/:id/messages` | Fetch message history |
| POST | `/sessions/:id/messages` | Send a message |

## Planned Features

- [ ] Document upload (pgvector RAG — backend in progress)
- [ ] Personal repository popup
- [ ] Model selector (Ollama / OpenAI toggle)
- [ ] Response feedback / ratings
