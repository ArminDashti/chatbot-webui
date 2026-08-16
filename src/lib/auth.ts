export type User = {
  id: string
  username: string
  display_name: string
  role: 'user' | 'admin' | string
  created_at: string
  updated_at: string
}

export type AuthResponse = {
  token: string
  user: User
}

export type Conversation = {
  id: string
  user_id: string
  username?: string
  title: string
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | string
  body: string
  created_at: string
}

export type ConversationDetail = {
  conversation: Conversation
  messages: ChatMessage[]
}

export type Group = {
  id: string
  name: string
  rule_body: string
  member_ids: string[]
  created_at: string
}

export type SummaryStats = {
  users: number
  conversations: number
  messages: number
}

export type ChatStats = {
  by_user: { user_id: string; username: string; conversations: number; messages: number }[]
  by_day: { day: string; conversations: number; messages: number }[]
}

const TOKEN_KEY = 'chatbot-token'
const USER_KEY = 'chatbot-user'

export const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw === undefined || raw === '') return ''
  return raw.replace(/\/$/, '')
})()

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function apiFetch<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function login(body: { username: string; password: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>('/api/v1/me', {}, true)
}

export function patchMe(body: { display_name?: string; password?: string }): Promise<User> {
  return apiFetch<User>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(body) }, true)
}

export function createConversation(title = ''): Promise<Conversation> {
  return apiFetch<Conversation>(
    '/api/v1/conversations',
    { method: 'POST', body: JSON.stringify({ title }) },
    true,
  )
}

export function fetchConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>('/api/v1/conversations', {}, true)
}

export function fetchConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/api/v1/conversations/${encodeURIComponent(id)}`, {}, true)
}

export async function sendMessageStream(
  conversationId: string,
  body: string,
  onEvent: (ev: { type: string; text?: string; message?: ChatMessage; error?: string }) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')
  const response = await fetch(
    `${API_BASE}/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
      signal,
    },
  )
  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      const json = line.slice(5).trim()
      if (!json) continue
      onEvent(JSON.parse(json) as { type: string; text?: string; message?: ChatMessage; error?: string })
    }
  }
}

export function fetchSummary(): Promise<SummaryStats> {
  return apiFetch<SummaryStats>('/api/v1/admin/stats/summary', {}, true)
}

export function fetchChatStats(): Promise<ChatStats> {
  return apiFetch<ChatStats>('/api/v1/admin/stats/chats', {}, true)
}

export function fetchAdminConversations(userId?: string): Promise<Conversation[]> {
  const q = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  return apiFetch<Conversation[]>(`/api/v1/admin/conversations${q}`, {}, true)
}

export function fetchAdminConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/api/v1/admin/conversations/${encodeURIComponent(id)}`, {}, true)
}

export function fetchGlobalRule(): Promise<{ body: string }> {
  return apiFetch<{ body: string }>('/api/v1/admin/rules', {}, true)
}

export function putGlobalRule(body: string): Promise<{ body: string }> {
  return apiFetch<{ body: string }>(
    '/api/v1/admin/rules',
    { method: 'PUT', body: JSON.stringify({ body }) },
    true,
  )
}

export function fetchGroups(): Promise<Group[]> {
  return apiFetch<Group[]>('/api/v1/admin/groups', {}, true)
}

export function createGroup(name: string, member_ids: string[]): Promise<Group> {
  return apiFetch<Group>(
    '/api/v1/admin/groups',
    { method: 'POST', body: JSON.stringify({ name, member_ids }) },
    true,
  )
}

export function putGroupRule(id: string, body: string): Promise<{ body: string }> {
  return apiFetch<{ body: string }>(
    `/api/v1/admin/groups/${encodeURIComponent(id)}/rules`,
    { method: 'PUT', body: JSON.stringify({ body }) },
    true,
  )
}

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>('/api/v1/admin/users', {}, true)
}

export type ChatSettings = {
  chat_base_url: string
  chat_model: string
  chat_api_key_set: boolean
  chat_api_key_hint: string
}

export function fetchSettings(): Promise<ChatSettings> {
  return apiFetch<ChatSettings>('/api/v1/admin/settings', {}, true)
}

export function putSettings(body: {
  chat_base_url: string
  chat_model: string
  chat_api_key?: string
  clear_chat_api_key?: boolean
}): Promise<ChatSettings> {
  return apiFetch<ChatSettings>(
    '/api/v1/admin/settings',
    { method: 'PUT', body: JSON.stringify(body) },
    true,
  )
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}
