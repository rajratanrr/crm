import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CalendarDays } from 'lucide-react';
import { eventApi, customerApi } from '../../services/api';
import { formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const eventTypes = ['WEDDING','PRE_WEDDING','ENGAGEMENT','RECEPTION','HALDI','MEHENDI','SANGEET','BIRTHDAY','CORPORATE','OTHER'];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({ customerId: '', eventName: '', eventType: 'WEDDING', startDate: '', venue: '', city: '', guestCount: 0 });
  const navigate = useNavigate();

  const load = async () => {
    try { const { data } = await eventApi.getAll({ search }); setEvents(data.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);
  useEffect(() => { if (showModal) customerApi.getAll({ limit: '200' }).then(r => setCustomers(r.data.data)).catch(()=>{}); }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const { data } = await eventApi.create(form); toast.success('Event created!'); setShowModal(false); navigate(`/events/${data.data.id}`); } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Events</h2><p className="text-sm text-gray-500">Manage weddings and events</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Add Event</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
          </div>
        </div>
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div> :
        events.length === 0 ? <EmptyState title="No events" /> :
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Event', 'Customer', 'Type', 'Date', 'Venue', 'Team', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {events.map((e: any) => (
                <tr key={e.id} onClick={() => navigate(`/events/${e.id}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.eventName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.customer?.fullName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.eventType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(e.startDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{e.venue || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.assignments?.length || 0} members</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Event" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select required value={form.customerId} onChange={(e) => setForm({...form, customerId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
              <select value={form.eventType} onChange={(e) => setForm({...form, eventType: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {eventTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <input required value={form.eventName} onChange={(e) => setForm({...form, eventName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="datetime-local" required value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Event</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
