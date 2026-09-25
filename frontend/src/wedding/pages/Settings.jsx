import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Bell, Users, CreditCard, Shield, Palette, X, Mail, MessageSquare, Clock } from 'lucide-react'
import { useSettingsStore } from '../settingsStore'
import { useToastStore } from '../components/Toast'

export default function Settings() {
  const { theme, notifications, toggleNotification, setStudioProfile, studioProfile } = useSettingsStore()
  const { addToast } = useToastStore()
  const [openSection, setOpenSection] = useState(null)
  const [studioForm, setStudioForm] = useState(studioProfile)

  const handleSaveStudio = () => {
    setStudioProfile(studioForm)
    addToast('Studio profile updated successfully', 'success')
    setOpenSection(null)
  }

  const sections = [
    { 
      id: 'studio',
      icon: Camera, 
      title: 'Studio Profile', 
      desc: 'Branding, logo and contact info',   
      color: 'bg-brand-50 text-brand-700',
      darkColor: 'dark:bg-brand-900/20 dark:text-brand-400'
    },
    { 
      id: 'appearance',
      icon: Palette, 
      title: 'Appearance', 
      desc: 'Theme, colors and layout',          
      color: 'bg-purple-50 text-purple-700',
      darkColor: 'dark:bg-purple-900/20 dark:text-purple-400'
    },
    { 
      id: 'team',
      icon: Users, 
      title: 'Team & Roles', 
      desc: 'Members and permissions',           
      color: 'bg-blue-50 text-blue-700',
      darkColor: 'dark:bg-blue-900/20 dark:text-blue-400'
    },
    { 
      id: 'payments',
      icon: CreditCard, 
      title: 'Payments & Invoices',
      desc: 'Tax, currency and templates',       
      color: 'bg-emerald-50 text-emerald-700',
      darkColor: 'dark:bg-emerald-900/20 dark:text-emerald-400'
    },
    { 
      id: 'notifications',
      icon: Bell, 
      title: 'Notifications', 
      desc: 'Email, WhatsApp and reminders',     
      color: 'bg-amber-50 text-amber-700',
      darkColor: 'dark:bg-amber-900/20 dark:text-amber-400'
    },
    { 
      id: 'security',
      icon: Shield, 
      title: 'Security', 
      desc: 'Password, 2FA and sessions',        
      color: 'bg-rose-50 text-rose-700',
      darkColor: 'dark:bg-rose-900/20 dark:text-rose-700'
    },
  ]

  return (
    <div className={`p-6 lg:p-8 max-w-6xl mx-auto min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Configure your studio preferences and integrations.</p>
      </motion.div>

      {/* Studio Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 mb-8 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-soft'}`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Camera className="text-white" size={26} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{studioProfile.name}</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Premium Wedding Photography · Est. 2018</p>
          </div>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s, idx) => {
          const Icon = s.icon
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (idx + 1) }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOpenSection(s.id)}
              className={`rounded-xl p-5 text-left border transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-brand-500/50 hover:shadow-lg'
                  : 'bg-white border-gray-100 hover:shadow-card hover:border-brand-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color} ${s.darkColor}`}>
                <Icon size={18} />
              </div>
              <div className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.title}</div>
              <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</div>
              <div className={`text-xs font-semibold mt-3 flex items-center gap-1 ${theme === 'dark' ? 'text-brand-400' : 'text-brand-600'}`}>
                Edit →
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {openSection === 'studio' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setOpenSection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-8 max-w-md w-full mx-4 shadow-pop ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Studio Profile</h2>
                <button onClick={() => setOpenSection(null)} className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Studio Name</label>
                  <input
                    type="text"
                    value={studioForm.name}
                    onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-brand-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-500 focus:bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input
                    type="email"
                    value={studioForm.email}
                    onChange={(e) => setStudioForm({ ...studioForm, email: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-brand-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-500 focus:bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
                  <input
                    type="tel"
                    value={studioForm.phone}
                    onChange={(e) => setStudioForm({ ...studioForm, phone: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-brand-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-brand-500 focus:bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setOpenSection(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-all ${
                    theme === 'dark'
                      ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudio}
                  className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {openSection === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setOpenSection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-8 max-w-md w-full mx-4 shadow-pop ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
                <button onClick={() => setOpenSection(null)} className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  { key: 'email', label: 'Email Notifications', icon: Mail },
                  { key: 'whatsapp', label: 'WhatsApp Messages', icon: MessageSquare },
                  { key: 'in_app', label: 'In-App Notifications', icon: Bell },
                  { key: 'reminders', label: 'Reminders', icon: Clock },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <Icon size={16} className={theme === 'dark' ? 'text-brand-400' : 'text-brand-600'} />
                        </div>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                          notifications[item.key] ? 'bg-brand-600' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications[item.key] ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setOpenSection(null)}
                className="w-full px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}

        {openSection === 'appearance' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setOpenSection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-8 max-w-md w-full mx-4 shadow-pop ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Appearance</h2>
                <button onClick={() => setOpenSection(null)} className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>

              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Theme is currently set to <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>. Use the theme toggle button in the top bar to switch themes.</p>

              <button
                onClick={() => setOpenSection(null)}
                className="w-full px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {['team', 'payments', 'security'].includes(openSection) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setOpenSection(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-8 max-w-md w-full mx-4 shadow-pop ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{sections.find(s => s.id === openSection)?.title}</h2>
                <button onClick={() => setOpenSection(null)} className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>

              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>This feature is coming soon. Stay tuned!</p>

              <button
                onClick={() => setOpenSection(null)}
                className="w-full px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}