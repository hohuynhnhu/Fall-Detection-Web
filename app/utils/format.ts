export function formatDate(d: string | number): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(d: string | number): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function confidenceClass(score: number): string {
  if (score >= 0.85) return 'bg-red-100 text-red-700'
  if (score >= 0.6) return 'bg-orange-100 text-orange-700'
  return 'bg-yellow-100 text-yellow-700'
}

export function confidenceLabel(score: number): string {
  if (score >= 0.85) return 'Cao'
  if (score >= 0.6) return 'Trung bình'
  return 'Thấp'
}
