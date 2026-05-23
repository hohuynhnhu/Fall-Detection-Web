export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { token, user, clearAuth, initAuth } = useAuth()

  initAuth()

  if (!token.value) {
    return navigateTo('/login')
  }

  if (!user.value) {
    try {
      const { apiFetch } = useApi()
      const me = await apiFetch<any>('/admin/me')
      user.value = me

      if (me?.role !== 'admin') {
        clearAuth()
        return navigateTo('/login')
      }
    } catch {
      // 401 is already handled in useApi → navigateTo('/login')
    }
  }
})
