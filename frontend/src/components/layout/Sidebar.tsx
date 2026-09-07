import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, CalendarDays, Package, FileText, IndianRupee, Receipt, UsersRound, CheckSquare, Image, BarChart3, Bell, Settings, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';

const menuSections = [
  { label: 'MAIN', items: [
    { name: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
    { name: 'Customers', icon: Users, route: '/customers' },
    { name: 'Leads', icon: UserPlus, route: '/leads' },
    { name: 'Events', icon: CalendarDays, route: '/events' },
  ]},
  { label: 'BUSINESS', items: [
    { name: 'Packages', icon: Package, route: '/packages' },
    { name: 'Contracts', icon: FileText, route: '/contracts' },
    { name: 'Payments', icon: IndianRupee, route: '/payments' },
    { name: 'Invoices', icon: Receipt, route: '/invoices' },
  ]},
  { label: 'OPERATIONS', items: [
    { name: 'Team', icon: UsersRound, route: '/team' },
    { name: 'Tasks', icon: CheckSquare, route: '/tasks' },
    { name: 'Deliverables', icon: Image, route: '/deliverables' },
  ]},
  { label: 'ANALYTICS', items: [
    { name: 'Reports', icon: BarChart3, route: '/reports' },
  ]},
  { label: 'SYSTEM', items: [
    { name: 'Notifications', icon: Bell, route: '/notifications' },
    { name: 'Settings', icon: Settings, route: '/settings' },
  ]},
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-30 flex flex-col',
      collapsed ? 'w-[72px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-lg text-gray-900 tracking-tight">Studio CRM</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {menuSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{section.label}</p>}
            {section.items.map((item) => {
              const isActive = location.pathname === item.route || location.pathname.startsWith(item.route + '/');
              return (
                <Link key={item.route} to={item.route}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}>
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
