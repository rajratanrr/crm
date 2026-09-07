import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { leadApi, customerApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const statuses = ['ALL', 'NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST'];
const eventTypes = ['WEDDING', 'PRE_WEDDING', 'ENGAGEMENT', 'RECEPTION', 'HALDI', 'MEHENDI', 'SANGEET', 'BIRTHDAY', 'CORPORATE', 'OTHER'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', eventType: 'WEDDING', source: 'Instagram', estimatedBudget: 0, notes: '' });

  const load = async () => {
    try { const { data } = await leadApi.getAll({ status: filter !== 'ALL' ? filter : undefined, search }); setLeads(data.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await leadApi.create(form); toast.success('Lead created!'); setShowModal(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try { await leadApi.updateStatus(id, status); toast.success('Status updated'); load(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Leads</h2><p className="text-sm text-gray-500">Track and manage all inquiries</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Add Lead</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Customer', 'Event Type', 'Event Date', 'Budget', 'Source', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{l.customer?.fullName || '-'}</p><p className="text-xs text-gray-400">{l.customer?.phone}</p></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.eventType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.eventDate ? formatDate(l.eventDate) : '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{l.estimatedBudget ? formatCurrency(l.estimatedBudget) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.source}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3">
                    <select value={l.status} onChange={(e) => handleStatusUpdate(l.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none">
                      {statuses.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Lead" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input required value={form.customerName} onChange={(e) => setForm({...form, customerName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input required value={form.customerPhone} onChange={(e) => setForm({...form, customerPhone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select value={form.eventType} onChange={(e) => setForm({...form, eventType: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {eventTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Est. Budget</label>
              <input type="number" value={form.estimatedBudget} onChange={(e) => setForm({...form, estimatedBudget: +e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Lead</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
