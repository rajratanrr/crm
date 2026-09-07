import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Heart,
  Package,
  FileText,
  CreditCard,
  Image,
  Shirt,
  UserCircle,
  Tag,
  CalendarDays,
  Camera,
  ListChecks,
  Calendar,
  UsersRound,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigationSections = [
  {
    section: 'MAIN',
    items: [
      { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'CRM',
    items: [
      { label: 'Leads', route: '/leads', icon: UserPlus },
      { label: 'Clients', route: '/clients', icon: Users },
    ],
  },
  {
    section: 'WEDDING SHOOT',
    badge: 'WEDDING',
    items: [
      { label: 'Wedding Projects', route: '/wedding/projects', icon: Heart },
      { label: 'Wedding Clients', route: '/wedding/clients', icon: Users },
      { label: 'Packages', route: '/wedding/packages', icon: Package },
      { label: 'Contracts', route: '/wedding/contracts', icon: FileText },
      { label: 'Payments', route: '/wedding/payments', icon: CreditCard },
      { label: 'Deliverables', route: '/wedding/deliverables', icon: Image },
    ],
  },
  {
    section: 'STUDIO FASHION',
    badge: 'FASHION',
    items: [
      { label: 'Fashion Projects', route: '/fashion/projects', icon: Shirt },
      { label: 'Fashion Clients', route: '/fashion/clients', icon: Users },
      { label: 'Models', route: '/fashion/models', icon: UserCircle },
      { label: 'Garment Inventory', route: '/fashion/garments', icon: Tag },
      { label: 'Studio Bookings', route: '/fashion/bookings', icon: CalendarDays },
      { label: 'Payments', route: '/fashion/payments', icon: CreditCard },
      { label: 'Deliverables', route: '/fashion/deliverables', icon: Image },
    ],
  },
  {
    section: 'PROJECTS',
    items: [
      { label: 'All Projects', route: '/projects', icon: Camera },
      { label: 'Tasks', route: '/tasks', icon: ListChecks },
      { label: 'Calendar', route: '/calendar', icon: Calendar },
    ],
  },
  {
    section: 'TEAM',
    items: [
      { label: 'Employees', route: '/employees', icon: UsersRound },
      { label: 'Attendance', route: '/attendance', icon: ClipboardList },
      { label: 'Team Booking', route: '/team-booking', icon: CalendarDays },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { label: 'Payments', route: '/finance/payments', icon: CreditCard },
      { label: 'Invoices', route: '/invoices', icon: FileText },
      { label: 'Expenses', route: '/expenses', icon: ChartNoAxesCombined },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'Business Settings', route: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isCurrentActive = (route: string) => {
    if (route === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    if (route === '/clients') return location.pathname === '/clients' || location.pathname === '/customers';
    if (route === '/projects') return location.pathname === '/projects';
    if (route === '/wedding/packages') return location.pathname === '/wedding/packages' || location.pathname === '/packages';
    if (route === '/wedding/contracts') return location.pathname === '/wedding/contracts' || location.pathname === '/contracts';
    if (route === '/wedding/deliverables') return location.pathname === '/wedding/deliverables' || location.pathname === '/deliverables';
    if (route === '/finance/payments') return location.pathname === '/finance/payments' || location.pathname === '/payments';
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-4 border-b border-gray-100/90 justify-between bg-white select-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#C59B27] to-[#9A7318] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#C59B27]/20 text-white font-bold text-lg tracking-wider">
            IPC
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-gray-900 leading-tight">
                IPC Studios
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-[#B8860B] uppercase mt-0.5">
                WEDDING &bull; FASHION &bull; CREATIVE
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
        {navigationSections.map((section) => (
          <div key={section.section} className="space-y-1">
            {!collapsed && (
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {section.section}
                </span>
                {section.badge && (
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                    section.badge === 'WEDDING' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-purple-50 text-purple-700 border border-purple-200/50'
                  )}>
                    {section.badge}
                  </span>
                )}
              </div>
            )}
            {section.items.map((item) => {
              const active = isCurrentActive(item.route);
              const Icon = item.icon;
              return (
                <Link
                  key={item.route}
                  to={item.route}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group',
                    active
                      ? 'bg-[#FAF5EB] text-[#9A7318] font-semibold border-l-[3.5px] border-[#C59B27] shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                      active ? 'text-[#C59B27]' : 'text-gray-400 group-hover:text-gray-700'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 tracking-tight text-[13.5px]">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Domain Quick Status */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 m-2 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Wedding
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Fashion
            </span>
          </div>
          <div className="text-[10px] text-gray-400 text-center font-medium">
            IPC Studios CRM &bull; PostgreSQL
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-72 bg-white z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-100/90 transition-all duration-300 z-30 flex-col shadow-[1px_0_4px_rgba(0,0,0,0.02)]',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
