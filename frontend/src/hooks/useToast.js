import { useState } from 'react'

let _toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 3500) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), duration)
  }

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return {
    toasts,
    removeToast,
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  }
}
