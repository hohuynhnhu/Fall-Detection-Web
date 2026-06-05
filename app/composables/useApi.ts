import type { FetchOptions } from 'ofetch'

export const useApi = () => {
  const config = useRuntimeConfig()
  const { token, clearAuth } = useAuth()
  const toast = useToast()

  const apiFetch = async <T = any>(
    path: string,
    options: {
      method?: FetchOptions['method']  
      body?: any
      params?: Record<string, any>
      headers?: Record<string, string>
    } = {}
  ): Promise<T> => {
    const { params, body, method = 'GET' as const, headers = {} } = options

    const query = params
      ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
      : undefined

    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        method, 
        body,
        query,
        headers: {
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
          ...headers
        }
      })
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status

      if (status === 401) {
        clearAuth()
        await navigateTo('/login')
        throw err
      }

      if (status === 403) {
        toast.add('error', 'Bạn không có quyền thực hiện thao tác này')
        throw err
      }

      throw err
    }
  }

  return { apiFetch }
}