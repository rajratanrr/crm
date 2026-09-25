import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import Calendar from './pages/Calendar'
import Deliverables from './pages/Deliverables'
import Financials from './pages/Financials'
import Team from './pages/Team'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import Attendance from './pages/Attendance'
import ToastContainer from './components/Toast'
import { useSettingsStore } from './settingsStore'

export default function App() {
  const [route, setRoute] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const { theme } = useSettingsStore()

  const pages = {
    dashboard: <Dashboard goto={setRoute} />,
    leads: <Leads />,
    clients: <Clients />,
    projects: <Projects onCreate={() => setRoute('create-project')} onEdit={(project) => { setSelectedProject(project); setRoute('edit-project') }} />,
    'create-project': <CreateProject onDone={() => setRoute('projects')} />,
    'edit-project': <CreateProject project={selectedProject} onDone={() => { setSelectedProject(null); setRoute('projects') }} />,
    calendar: <Calendar />,
    attendance: <Attendance />,
    deliverables: <Deliverables />,
    financials: <Financials />,
    team: <Team />,
    chat: <Chat />,
    settings: <Settings />,
  }

  return (
    <div className={`theme-${theme} flex h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-[#FAFAFB] text-gray-900'} transition-colors`}>
      <Sidebar route={route} setRoute={setRoute} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onCreate={() => setRoute('create-project')} onSettingsClick={() => setRoute('settings')} />
        <main className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-[#FAFAFB]'} transition-colors`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {pages[route]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}