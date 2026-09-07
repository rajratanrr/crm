import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, FileText, IndianRupee, Clock, Image, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../services/api';
import { formatCurrency, formatDate } from '../lib/utils';
import KPICard from '../components/ui/KPICard';
import StatusBadge from '../components/ui/StatusBadge';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [paymentAlerts, setPaymentAlerts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, ue, rc, pa, t] = await Promise.all([
          dashboardApi.getStats(), dashboardApi.getRevenue(), dashboardApi.getUpcomingEvents(),
          dashboardApi.getRecentCustomers(), dashboardApi.getPaymentAlerts(), dashboardApi.getTasks(),
        ]);
        setStats(s.data.data); setRevenue(r.data.data); setUpcomingEvents(ue.data.data);
        setRecentCustomers(rc.data.data); setPaymentAlerts(pa.data.data); setTasks(t.data.data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Dashboard</h2><p className="text-sm text-gray-500">Overview of your studio business</p></div>
        <div className="flex gap-2">
          {[{ label: 'Customer', route: '/customers' }, { label: 'Lead', route: '/leads' }, { label: 'Event', route: '/events' }].map((a) => (
            <button key={a.label} onClick={() => navigate(a.route)} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
              <Plus className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Customers" value={stats?.totalCustomers || 0} icon={<Users className="w-5 h-5" />} color="indigo" />
        <KPICard title="Upcoming Events" value={stats?.upcomingEvents || 0} icon={<CalendarDays className="w-5 h-5" />} color="blue" />
        <KPICard title="Active Contracts" value={stats?.activeContracts || 0} icon={<FileText className="w-5 h-5" />} color="purple" />
        <KPICard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={<IndianRupee className="w-5 h-5" />} color="green" />
        <KPICard title="Pending Payments" value={formatCurrency(stats?.pendingPayments || 0)} icon={<Clock className="w-5 h-5" />} color="orange" />
        <KPICard title="Pending Deliverables" value={stats?.pendingDeliverables || 0} icon={<Image className="w-5 h-5" />} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenue.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v) || 0)} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {upcomingEvents.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No upcoming events</p> :
              upcomingEvents.map((e: any) => (
                <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.eventName}</p>
                    <p className="text-xs text-gray-500">{e.customer?.fullName} • {e.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-indigo-600">{formatDate(e.startDate)}</p>
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Customers</h3>
          <div className="space-y-2">
            {recentCustomers.map((c: any) => (
              <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{c.fullName.split(' ').map((n:string)=>n[0]).join('')}</div>
                  <div><p className="text-sm font-medium text-gray-900">{c.fullName}</p><p className="text-xs text-gray-500">{c.city}</p></div>
                </div>
                <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Alerts</h3>
          <div className="space-y-2">
            {paymentAlerts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div><p className="text-sm font-medium text-gray-900">{a.customer?.fullName}</p><p className="text-xs text-gray-500">{a.event?.eventName}</p></div>
                <p className="text-sm font-bold text-orange-600">{formatCurrency(a.remainingAmount)}</p>
              </div>
            ))}
            {paymentAlerts.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No pending payments</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
