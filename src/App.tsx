import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  const loadMe = useAuthStore((s) => s.loadMe)

  useEffect(() => {
    loadMe()
  }, [loadMe])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}