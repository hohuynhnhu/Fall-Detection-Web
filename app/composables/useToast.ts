export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export const useToast = () => {
  const toasts = useState<Toast[]>('app.toasts', () => [])

  const add = (type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    toasts.value.push({ id, type, message })
    setTimeout(() => remove(id), 4000)
  }

  const remove = (id: string) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx > -1) toasts.value.splice(idx, 1)
  }

  return { toasts, add, remove }
}
