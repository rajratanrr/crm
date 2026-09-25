import { motion } from 'framer-motion'
import { TrendingUp, Users, Heart, IndianRupee, Calendar as CalIcon, ArrowUpRight, Clock } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useStore } from '../store'

const revenueData = [
  { m: 'Jan', v: 220000 }, { m: 'Feb', v: 340000 }, { m: 'Mar', v: 280000 },
  { m: 'Apr', v: 420000 }, { m: 'May', v: 510000 }, { m: 'Jun', v: 480000 },
  { m: 'Jul', v: 620000 }, { m: 'Aug', v: 710000 }, { m: 'Sep', v: 660000 },
  { m: 'Oct', v: 780000 }, { m: 'Nov', v: 900000 }, { m: 'Dec', v: 1050000 },
]

function Stat({ icon: Icon, label, value, delta, tone = 'brand' }) {
  const tones = {
    brand:   'bg-brand-50 text-brand-700',
    green:   'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    rose:    'bg-rose-50 text-rose-700',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon size={18} />
        </div>
        {delta && (
          <span className="badge bg-emerald-50 text-emerald-700">
            <ArrowUpRight size={12} /> {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </motion.div>
  )
}

export default function Dashboard({ goto }) {
  const { leads, clients, projects, payments } = useStore()
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
  const pending = projects.reduce((s, p) => s + (p.totalBudget - p.amountPaid), 0)
  const upcoming = projects
    .flatMap((p) => p.events.map((e) => ({ ...e, project: p.name })))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, Dhyan 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening across Photo Fashion Studio today.</p>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-1.5">
          <Clock size={14} /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Heart}      label="Active Weddings"   value={projects.length}  delta="+12%" tone="brand" />
        <Stat icon={Users}      label="Total Clients"     value={clients.length}   delta="+8%"  tone="green" />
        <Stat icon={TrendingUp} label="New Leads"         value={leads.filter(l => l.status === 'NEW').length} tone="amber" />
        <Stat icon={IndianRupee}label="Revenue Collected" value={`₹${(totalRevenue/100000).toFixed(1)}L`} delta="+24%" tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Monthly collection across all wedding projects</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Income</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Pending</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec2778" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ec2778" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f1f4" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #eee', fontSize: 12, boxShadow: '0 10px 30px rgba(0,0,0,.08)' }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="v" stroke="#ec2778" strokeWidth={2.4} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Events</h2>
            <button onClick={() => goto('calendar')} className="text-xs text-brand-600 font-medium hover:text-brand-800">View all</button>
          </div>
          <div className="space-y-3">
            {upcoming.map((e) => {
              const d = new Date(e.date)
              return (
                <motion.div key={e.id} whileHover={{ x: 3 }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-11 h-11 rounded-lg bg-brand-50 flex flex-col items-center justify-center text-brand-700 shrink-0">
                    <span className="text-[10px] font-bold uppercase leading-none">{d.toLocaleString('en', { month: 'short' })}</span>
                    <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">{e.name}</div>
                    <div className="text-xs text-gray-500 truncate">{e.project} · {e.startTime}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Active Wedding Projects</h2>
          <div className="space-y-3">
            {projects.slice(0, 3).map((p) => {
              const pct = Math.round((p.amountPaid / p.totalBudget) * 100)
              return (
                <div key={p.id} className="p-4 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.venue}</div>
                    </div>
                    <span className="badge bg-brand-100 text-brand-700">{p.status}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-gray-500">
                    <span>₹{p.amountPaid.toLocaleString('en-IN')} paid</span>
                    <span>{pct}% of ₹{p.totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
          <CalIcon className="opacity-80 mb-3" size={22} />
          <div className="text-xs uppercase tracking-widest text-white/70 font-semibold">Total Pending</div>
          <div className="text-3xl font-bold mt-1">₹{(pending/100000).toFixed(2)}L</div>
          <p className="text-sm text-white/80 mt-2">Across {projects.length} active projects</p>
          <button onClick={() => goto('financials')} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors">
            View Financials <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}