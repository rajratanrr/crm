import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' or 'dark'
      notifications: {
        email: true,
        whatsapp: true,
        in_app: true,
        reminders: true,
      },
      sidebarCollapsed: false,
      studioProfile: {
        name: 'Photo Fashion Studio',
        email: 'hello@photofashionstudio.com',
        phone: '+91 90000 00000',
      },
      
      // Theme
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      
      // Notifications
      toggleNotification: (key) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: !state.notifications[key] },
        })),
      setNotifications: (notifications) => set({ notifications }),
      
      // Sidebar
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Studio Profile
      setStudioProfile: (profile) => set({ studioProfile: { ...get().studioProfile, ...profile } }),
    }),
    { name: 'pfs-settings' }
  )
)
