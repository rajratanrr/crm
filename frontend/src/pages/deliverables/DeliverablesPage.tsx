import { useEffect, useState } from 'react';
import { deliverableApi } from '../../services/api';
import { formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';

export default function DeliverablesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    try { const { data } = await deliverableApi.getAll(filter !== 'ALL' ? { status: filter } : {}); setItems(data.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    await deliverableApi.updateStatus(id, { status }); load();
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Deliverables</h2><p className="text-sm text-gray-500">Track photo & video deliveries</p></div>
      <div className="flex gap-2 flex-wrap">
        {['ALL','PENDING','IN_PRODUCTION','READY','DELIVERED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
          {['Type', 'Customer', 'Event', 'Qty', 'Due Date', 'Delivery Date', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
        </tr></thead><tbody>
          {items.map((d: any) => (
            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium">{d.type?.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.event?.customer?.fullName || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.event?.eventName || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.quantity}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.dueDate ? formatDate(d.dueDate) : '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.deliveryDate ? formatDate(d.deliveryDate) : '-'}</td>
              <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
              <td className="px-4 py-3"><select value={d.status} onChange={(e) => handleStatusChange(d.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1">
                {['PENDING','IN_PRODUCTION','READY','DELIVERED'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select></td>
            </tr>))}
        </tbody></table></div>
      </div>
    </div>
  );
}
