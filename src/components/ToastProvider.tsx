'use client'

import React from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: string
  message: string
  type: ToastType
}

export default function ToastProvider() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    function handleToastEvent(e: Event) {
      const detail = (e as CustomEvent).detail || {}
      const toast: Toast = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        message: detail.message || 'Something went wrong',
        type: detail.type || 'info'
      }
      setToasts(prev => [...prev, toast])
      const duration = detail.duration ?? 4000
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, duration)
    }

    window.addEventListener('app-toast', handleToastEvent as EventListener)
    return () => window.removeEventListener('app-toast', handleToastEvent as EventListener)
  }, [])

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          style={{
            minWidth: 280,
            maxWidth: 360,
            padding: '10px 14px',
            borderRadius: 8,
            color: '#111',
            background: t.type === 'success' ? '#D1FAE5' : t.type === 'error' ? '#FEE2E2' : t.type === 'warning' ? '#FEF3C7' : '#E5E7EB',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#111827' }}>
            {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : t.type === 'warning' ? 'Warning' : 'Notice'}
          </div>
          <div style={{ fontSize: 14, color: '#111827' }}>{t.message}</div>
        </div>
      ))}
    </div>
  )
}


