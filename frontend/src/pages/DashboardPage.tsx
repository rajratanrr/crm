import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  IndianRupee,
  Clock,
  Heart,
  Shirt,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Camera,
} from 'lucide-react';
import { dashboardApi, formatCurrency, formatDate } from '../services/api';
import KPICard from '../components/ui/KPICard';
import StatusBadge from '../components/ui/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRevenue(),
      dashboardApi.getRecentProjects(),
      dashboardApi.getUpcomingEvents(),
      dashboardApi.getTasks(),
    ])
      .then(([s, r, p, e, t]) => {
        setStats(s.data.data);
        setRevenue(r.data.data);
        setRecentProjects(p.data.data);
        setUpcomingEvents(e.data.data);
        setTasks(t.data.data);
      })
      .catch((err) => console.error('Dashboard load error', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
      </div>
    );
  }

  const distributionData = [
    { name: 'Wedding Shoot', value: stats?.weddingProjects || 0, color: '#D4AF37' },
    { name: 'Studio Fashion', value: stats?.fashionProjects || 0, color: '#8B5CF6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-zinc-900 to-neutral-800 text-white p-6 rounded-2xl shadow-sm border border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#C59B27]/20 text-[#D4AF37] border border-[#C59B27]/30">
              PFS
            </span>
            <span className="text-xs text-stone-400">Wedding &bull; Fashion &bull; Creative</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Executive Studio Overview</h1>
          <p className="text-sm text-stone-400 mt-1">
            Real-time business telemetry across Wedding Shoot and Studio Fashion operations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
          <button
            onClick={() => navigate('/finance/payments')}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium rounded-xl transition-all border border-stone-700"
          >
            <IndianRupee className="w-4 h-4" />
            Payments
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Clients"
          value={stats?.totalCustomers ?? 0}
          icon={<Users className="w-5 h-5" />}
          change="Wedding & Fashion"
          trend="up"
        />
        <KPICard
          title="Upcoming Shoots"
          value={stats?.upcomingEvents ?? 0}
          icon={<CalendarDays className="w-5 h-5" />}
          change="Scheduled shoots"
          trend="up"
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={<IndianRupee className="w-5 h-5" />}
          change="Total receipts"
          trend="up"
        />
        <KPICard
          title="Pending Payments"
          value={formatCurrency(stats?.pendingPayments ?? 0)}
          icon={<Clock className="w-5 h-5" />}
          change="Outstanding dues"
          trend={stats?.pendingPayments > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Dual Business Domain Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wedding Shoot Domain Card */}
        <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-white rounded-2xl p-6 border border-amber-200/70 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
                <Heart className="w-6 h-6 fill-amber-500/20" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Business Domain</span>
                <h3 className="text-lg font-bold text-gray-900">Wedding Shoot Operations</h3>
              </div>
            </div>
            <Link
              to="/wedding/projects"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-200/60 transition-colors"
            >
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-amber-100">
              <p className="text-xs text-gray-500 font-medium">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.weddingProjects || 0}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-amber-100">
              <p className="text-xs text-gray-500 font-medium">Wedding Revenue</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(stats?.weddingRevenue || 0)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-gray-600 border-t border-amber-100">
            <Link to="/wedding/clients" className="hover:text-amber-700 underline">Wedding Clients</Link> &bull;
            <Link to="/wedding/packages" className="hover:text-amber-700 underline">Packages</Link> &bull;
            <Link to="/wedding/contracts" className="hover:text-amber-700 underline">Contracts</Link> &bull;
            <Link to="/wedding/payments" className="hover:text-amber-700 underline">Payments</Link>
          </div>
        </div>

        {/* Studio Fashion Domain Card */}
        <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-white rounded-2xl p-6 border border-purple-200/70 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-sm">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Business Domain</span>
                <h3 className="text-lg font-bold text-gray-900">Studio Fashion Operations</h3>
              </div>
            </div>
            <Link
              to="/fashion/projects"
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 bg-purple-100/60 px-3 py-1.5 rounded-lg border border-purple-200/60 transition-colors"
            >
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-purple-100">
              <p className="text-xs text-gray-500 font-medium">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.fashionProjects || 0}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-purple-100">
              <p className="text-xs text-gray-500 font-medium">Fashion Revenue</p>
              <p className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(stats?.fashionRevenue || 0)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-gray-600 border-t border-purple-100">
            <Link to="/fashion/clients" className="hover:text-purple-700 underline">Brand Clients</Link> &bull;
            <Link to="/fashion/models" className="hover:text-purple-700 underline">Models</Link> &bull;
            <Link to="/fashion/garments" className="hover:text-purple-700 underline">Wardrobe</Link> &bull;
            <Link to="/fashion/bookings" className="hover:text-purple-700 underline">Bays</Link> &bull;
            <Link to="/fashion/payments" className="hover:text-purple-700 underline">Payments</Link>
          </div>
        </div>
      </div>

      {/* Analytics: Revenue Overview & Project Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Combined Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly receipts: Wedding Shoot vs Studio Fashion</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]" /> Wedding
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" /> Fashion
              </span>
            </div>
          </div>

          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={revenue.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={((value: any, name: string) => [
                    formatCurrency(Number(value) || 0),
                    name === 'wedding' ? 'Wedding Shoot' : name === 'fashion' ? 'Studio Fashion' : 'Total',
                  ]) as any}
                />
                <Bar dataKey="wedding" fill="#D4AF37" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="fashion" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[270px] flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
              <TrendingUp className="w-8 h-8 mb-2 opacity-30 text-[#C59B27]" />
              <p className="text-xs">No revenue data yet. Record payments to see trends.</p>
            </div>
          )}
        </div>

        {/* Project Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 text-base">Project Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Volume breakdown across business domains</p>

          {distributionData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={((val: any) => [`${val} projects`, 'Count']) as any} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-3 w-full border-t border-gray-50 pt-3">
                {distributionData.map((d) => (
                  <div key={d.name} className="text-center">
                    <p className="text-xs text-gray-500 font-medium">{d.name}</p>
                    <p className="text-lg font-bold" style={{ color: d.color }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
              <Camera className="w-8 h-8 mb-2 opacity-30 text-[#C59B27]" />
              <p className="text-xs">No projects registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects & Upcoming Shoots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Recent Projects</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest projects created in both domains</p>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-[#B8860B] hover:text-[#9A7318] flex items-center gap-1">
              View All Projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Domain</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Budget</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentProjects.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">
                        {p.name}
                        <div className="text-[11px] text-gray-400">{p.projectNumber}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            p.projectType === 'WEDDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {p.projectType === 'WEDDING' ? 'Wedding Shoot' : 'Studio Fashion'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{p.customer?.fullName || '-'}</td>
                      <td className="py-3 font-semibold text-gray-900">{formatCurrency(p.budget)}</td>
                      <td className="py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 border border-dashed border-gray-100 rounded-xl">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#C59B27]" />
              <p className="text-sm font-medium text-gray-500">No projects yet</p>
              <p className="text-xs text-gray-400 mt-1">Start by creating a Wedding or Fashion project</p>
              <button
                onClick={() => navigate('/projects')}
                className="mt-3 px-3.5 py-1.5 bg-[#C59B27] text-white text-xs font-semibold rounded-lg hover:bg-[#b58c1e] transition-colors"
              >
                Create First Project
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Shoots */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">Upcoming Shoots</h3>
            <Link to="/calendar" className="text-xs font-semibold text-[#B8860B] hover:text-[#9A7318]">
              Calendar
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
              {upcomingEvents.slice(0, 5).map((e) => (
                <div key={e.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900 truncate">{e.eventName}</span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {formatDate(e.startDate)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                    <span>{e.customer?.fullName}</span>
                    <span className="text-gray-400">{e.venue || e.city || 'Studio'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-100 rounded-xl p-6">
              <CalendarDays className="w-8 h-8 mb-2 opacity-30 text-[#C59B27]" />
              <p className="text-xs text-center">No upcoming shoot dates scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
