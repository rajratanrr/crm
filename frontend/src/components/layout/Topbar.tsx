import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { searchApi, notificationApi } from '../../services/api';
import { getInitials } from '../../lib/utils';

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageTitle = location.pathname.split('/')[1] || 'Dashboard';
  const title = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);

  useEffect(() => {
    notificationApi.getAll().then(res => setUnreadCount(res.data.unreadCount || 0)).catch(() => {});
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const { data } = await searchApi.search(searchQuery);
          setSearchResults(data.data);
          setShowSearch(true);
        } catch { setSearchResults(null); }
      } else { setShowSearch(false); setSearchResults(null); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 w-72 border border-gray-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" placeholder="Search customers, events, contracts..."
              className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {showSearch && searchResults && (
            <div className="absolute top-12 left-0 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
              {searchResults.customers?.length > 0 && (
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">CUSTOMERS</p>
                  {searchResults.customers.map((c: any) => (
                    <button key={c.id} onClick={() => { navigate(`/customers/${c.id}`); setShowSearch(false); setSearchQuery(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm">{c.fullName} <span className="text-gray-400">• {c.customerCode}</span></button>
                  ))}
                </div>
              )}
              {searchResults.events?.length > 0 && (
                <div className="p-2 border-t">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">EVENTS</p>
                  {searchResults.events.map((e: any) => (
                    <button key={e.id} onClick={() => { navigate(`/events/${e.id}`); setShowSearch(false); setSearchQuery(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm">{e.eventName}</button>
                  ))}
                </div>
              )}
              {searchResults.contracts?.length > 0 && (
                <div className="p-2 border-t">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">CONTRACTS</p>
                  {searchResults.contracts.map((c: any) => (
                    <button key={c.id} onClick={() => { navigate(`/contracts/${c.id}`); setShowSearch(false); setSearchQuery(''); }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm">{c.contractNumber}</button>
                  ))}
                </div>
              )}
              {(!searchResults.customers?.length && !searchResults.events?.length && !searchResults.contracts?.length) && (
                <p className="p-4 text-sm text-gray-500 text-center">No results found</p>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>}
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
              {getInitials(user?.name || 'U')}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              <button onClick={() => { navigate('/settings'); setShowProfile(false); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <User className="w-4 h-4" /> Profile
              </button>
              <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
