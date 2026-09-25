import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { create } from 'zustand'

// Toast store
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, duration)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} />
      case 'error':
        return <AlertCircle size={18} />
      case 'info':
        return <Info size={18} />
      default:
        return <Info size={18} />
    }
  }

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900'
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-900'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-emerald-600'
      case 'error':
        return 'text-rose-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 400 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 400 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`mb-3 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${getBgColor(
              toast.type
            )}`}
          >
            <div className={getIconColor(toast.type)}>{getIcon(toast.type)}</div>
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
