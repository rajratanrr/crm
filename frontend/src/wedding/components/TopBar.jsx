import { Bell, Search, Plus, Moon, Sun, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useSettingsStore } from '../settingsStore'
import { useToastStore } from './Toast'

export default function TopBar({ onCreate, onSettingsClick }) {
  const { theme, toggleTheme } = useSettingsStore()
  const { addToast } = useToastStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleThemeToggle = () => {
    toggleTheme()
    addToast(`Switched to ${theme === 'light' ? 'dark' : 'light'} mode`, 'success')
  }

  const notifications = [
    { id: 1, title: 'Ananya approved teaser reel', time: '2 hours ago', read: false },
    { id: 2, title: 'Payment received from Priya & Arjun', time: '5 hours ago', read: true },
    { id: 3, title: 'Reminder: Confirm Drone Permits', time: '1 day ago', read: true },
  ]

  return (
    <header className={`h-16 relative z-30 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border-b flex items-center px-6 gap-4 shrink-0 transition-colors`}>
      <div className={`relative flex-1 max-w-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
        <input
          placeholder="Search clients, weddings, invoices…"
          className={`w-full pl-9 pr-4 py-2 rounded-lg border border-transparent text-sm
                       ${theme === 'dark' 
                         ? 'bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-700 focus:border-brand-500/50' 
                         : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-brand-300'
                       }
                       focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all`}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleThemeToggle}
          className={`p-2 rounded-lg transition-all ${
            theme === 'dark' 
              ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </motion.button>

        {/* Create Project */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-soft transition-all active:scale-[.98]"
        >
          <Plus size={15} /> Create Project
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-all ${
              theme === 'dark' 
                ? 'text-gray-400 hover:bg-gray-800' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white" />
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-pop z-50 ${
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-800' 
                    : 'bg-white border-gray-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${
                          notif.read 
                            ? 'opacity-60' 
                            : theme === 'dark' 
                            ? 'bg-gray-800/50' 
                            : 'bg-blue-50'
                        } ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.read ? 'bg-gray-300' : 'bg-brand-500'}`} />
                          <div>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{notif.time}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className={`px-4 py-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      No new notifications
                    </div>
                  )}
                </div>
                <div className={`px-4 py-3 border-t text-center ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <button className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfile(!showProfile)}
            className="brand-mark w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-soft hover:shadow-card transition-all"
          >
            D
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-pop z-50 ${
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-800' 
                    : 'bg-white border-gray-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Director</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>hello@studio.com</p>
                </div>

                <div className="py-2">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      onSettingsClick()
                      setShowProfile(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <SettingsIcon size={16} />
                    Settings
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      addToast('Logged out successfully', 'success')
                      setShowProfile(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <LogOut size={16} />
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}