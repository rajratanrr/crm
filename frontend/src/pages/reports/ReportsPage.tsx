import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { reportApi } from '../../services/api';
import { formatCurrency } from '../../lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function ReportsPage() {
  const [tab, setTab] = useState('revenue');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async (type: string) => {
    setLoading(true);
    try {
      let res;
      switch (type) {
        case 'revenue': res = await reportApi.getRevenue(); break;
        case 'customers': res = await reportApi.getCustomers(); break;
        case 'leads': res = await reportApi.getLeads(); break;
        case 'events': res = await reportApi.getEvents(); break;
        case 'packages': res = await reportApi.getPackages(); break;
        case 'team': res = await reportApi.getTeam(); break;
      }
      setData(res?.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadReport(tab); }, [tab]);

  const tabs = ['revenue', 'customers', 'leads', 'events', 'packages', 'team'];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Reports</h2><p className="text-sm text-gray-500">Analytics and business insights</p></div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
        {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div> : (
          <>
            {tab === 'revenue' && data && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Revenue Analysis</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.monthly?.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.byMethod?.map((m: any, i: number) => (
                    <div key={m.method} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500">{m.method?.replace(/_/g, ' ')}</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(m.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'customers' && data && (
              <div><h3 className="text-lg font-semibold mb-4">Customer Growth ({data.total} total)</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={data.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} />
                    <Tooltip /><Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer></div>
            )}
            {tab === 'leads' && data && (
              <div><h3 className="text-lg font-semibold mb-4">Lead Status Distribution</h3>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={400} height={350}>
                    <PieChart><Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={130} label={({status, count}) => `${status}: ${count}`}>
                      {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer></div></div>
            )}
            {tab === 'events' && data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div><h3 className="text-lg font-semibold mb-4">By Type</h3>
                  {data.byType?.map((e: any) => <div key={e.type} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2"><span className="text-sm">{e.type?.replace(/_/g, ' ')}</span><span className="text-sm font-bold">{e.count}</span></div>)}
                </div>
                <div><h3 className="text-lg font-semibold mb-4">By Status</h3>
                  {data.byStatus?.map((e: any) => <div key={e.status} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2"><span className="text-sm">{e.status}</span><span className="text-sm font-bold">{e.count}</span></div>)}
                </div>
              </div>
            )}
            {tab === 'packages' && data && (
              <div><h3 className="text-lg font-semibold mb-4">Package Performance</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} /><Bar dataKey="totalRevenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart></ResponsiveContainer></div>
            )}
            {tab === 'team' && data && (
              <div><h3 className="text-lg font-semibold mb-4">Team Overview</h3>
                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
                  {['Name', 'Role', 'Assignments', 'Tasks'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr></thead><tbody>
                  {data.map((e: any) => <tr key={e.name} className="border-b border-gray-50"><td className="px-4 py-3 text-sm font-medium">{e.name}</td><td className="px-4 py-3 text-sm text-gray-600">{e.role?.replace(/_/g, ' ')}</td><td className="px-4 py-3 text-sm">{e.assignments}</td><td className="px-4 py-3 text-sm">{e.tasks}</td></tr>)}
                </tbody></table></div></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
