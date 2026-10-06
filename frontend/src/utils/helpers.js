/** Utility helpers */
export function getErrorMessage(error) {
  if (!error) return 'An unexpected error occurred'
  if (error.response?.data?.detail) {
    const d = error.response.data.detail
    if (Array.isArray(d)) return d.map(e => e.msg || e).join(', ')
    return String(d)
  }
  return error.message || 'An unexpected error occurred'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export const LEAVE_TYPES = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'EMERGENCY', 'OTHER']
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']
export const EMPLOYEE_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']
