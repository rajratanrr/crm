import { motion } from 'framer-motion'
import {
  LayoutDashboard, Target, Users, Heart, Calendar, Package, ClipboardCheck,
  DollarSign, UserCog, MessageSquare, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useSettingsStore } from '../settingsStore'

const nav = [
  { key: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { key: 'leads',        label: 'Leads',        icon: Target },
  { key: 'clients',      label: 'Clients',      icon: Users },
  { key: 'projects',     label: 'Weddings',     icon: Heart },
  { key: 'calendar',     label: 'Calendar',     icon: Calendar },
  { key: 'attendance',   label: 'Attendance',   icon: ClipboardCheck },
  { key: 'deliverables', label: 'Deliverables', icon: Package },
  { key: 'financials',   label: 'Financials',   icon: DollarSign },
  { key: 'team',         label: 'Team',         icon: UserCog },
  { key: 'chat',         label: 'Chat',         icon: MessageSquare },
]

export default function Sidebar({ route, setRoute, collapsed, setCollapsed }) {
  const { theme } = useSettingsStore()

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ type: 'spring', damping: 24, stiffness: 200 }}
      className={`flex flex-col shrink-0 relative transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900 border-r border-gray-800'
          : 'bg-white border-r border-gray-100'
      }`}
    >
      <div className={`h-16 flex items-center gap-2 px-4 border-b transition-colors ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
      }`}>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="brand-mark w-10 h-10 rounded-xl flex items-center justify-center shadow-soft shrink-0 cursor-pointer"
        >
          <span className="font-serif text-white text-lg leading-none tracking-[-0.08em]">PF</span>
        </motion.div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="leading-tight overflow-hidden">
            <div className={`text-[15px] font-bold whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Photo Fashion</div>
            <div className="text-[11px] font-semibold text-brand-600 whitespace-nowrap tracking-[0.16em]">STUDIO · CRM</div>
          </motion.div>
        )}
      </div>

      <div className={`px-5 pt-5 pb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
        {!collapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Workspace</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon
          const active = route === item.key
          return (
            <motion.button
              key={item.key}
              onClick={() => setRoute(item.key)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active 
                  ? theme === 'dark'
                    ? 'text-brand-400'
                    : 'text-brand-700'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className={`absolute inset-0 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-brand-50'
                  }`}
                  transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                />
              )}
              <Icon size={18} className="relative z-10 shrink-0" />
              {!collapsed && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
            </motion.button>
          )
        })}
      </nav>

      <div className={`p-3 border-t space-y-0.5 transition-colors ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
      }`}>
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => setRoute('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            route === 'settings' 
              ? theme === 'dark'
                ? 'text-brand-400 bg-gray-800'
                : 'text-brand-700 bg-brand-50'
              : theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </motion.button>
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            theme === 'dark'
              ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-800'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </motion.button>
      </div>
    </motion.aside>
  )
}