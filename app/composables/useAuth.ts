interface AuthUser {
  id: string
  email: string
  display_name: string
  role: string
  is_active: boolean
  avatar_url?: string
  phone?: string
}

export const useAuth = () => {
  const token = useState<string | null>('auth.token', () => null)
  const user = useState<AuthUser | null>('auth.user', () => null)

  const initAuth = () => {
    if (import.meta.client && !token.value) {
      const stored = localStorage.getItem('id_token')
      if (stored) token.value = stored
    }
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    if (import.meta.client) {
      localStorage.setItem('id_token', newToken)
    }
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    if (import.meta.client) {
      localStorage.removeItem('id_token')
    }
  }

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  return { token, user, setToken, clearAuth, isAuthenticated, isAdmin, initAuth }
}
