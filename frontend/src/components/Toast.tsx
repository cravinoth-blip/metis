interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: number) => void
}

const icons: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`} onClick={() => onRemove(toast.id)}>
          <span style={{ fontSize: 16 }}>{icons[toast.type]}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
