// Mirrors src/api/schemas.py exactly

export interface UserResponse {
  user_id: string
  name: string
  email: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface SessionResponse {
  session_id: string
  user_id: string
  session_name: string
  is_active: boolean
  created_at: string
  terminated_at: string | null
}

export interface ChatMessageResponse {
  chat_id: string
  session_id: string
  sender: 'user' | 'assistant'
  message: string
  created_at: string
}

export interface SendMessageResponse {
  user_message: ChatMessageResponse
  assistant_message: ChatMessageResponse
}

// Request bodies
export interface SignUpRequest {
  name: string
  email: string
  password: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface CreateSessionRequest {
  session_name: string
}

export interface SendMessageRequest {
  message: string
}