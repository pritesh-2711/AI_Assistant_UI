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
  charts?: string[]   // base64 PNGs; only present on live responses, not history
}

export interface SendMessageResponse {
  user_message: ChatMessageResponse
  assistant_message: ChatMessageResponse
}

export interface UploadResponse {
  session_id: string
  filename: string
  file_path: string
  size_bytes: number
  content_type: string
  file_description: string
  parent_chunks: number
  child_chunks: number
}

export interface DocumentRecord {
  filename: string
  file_description: string
  file_type: string
  parent_chunks: number
  child_chunks: number
  ingested_at: string
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
  category?: 'workflow' | 'agent'
  variant?: 'fast' | 'deep' | 'single_rag_agent' | 'supervisor_orchestration_agent'
}
