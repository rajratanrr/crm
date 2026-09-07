import { useEffect, useState } from 'react';
import { Plus, Search, CalendarDays, Trash2, Edit2, Clock, CheckCircle2 } from 'lucide-react';
import { bookingApi, projectApi, customerApi, formatCurrency, formatDate } from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function FashionBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);

  const [form, setForm] = useState({
    studioBay: 'Studio Bay A - White Cyclorama',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    projectId: '',
    customerId: '',
    bookedBy: '',
    purpose: 'Fashion Lookbook Shoot',
    cost: '35000',
    status: 'CONFIRMED',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, pRes, cRes] = await Promise.all([
        bookingApi.getAll(),
        projectApi.getAll({ type: 'FASHION' }),
        customerApi.getAll({ clientType: 'FASHION' }),
      ]);
      setBookings(bRes.data.data);
      setProjects(pRes.data.data);
      setCustomers(cRes.data.data);
    } catch {
      toast.error('Failed to load studio bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    setEditingBooking(null);
    setForm({
      studioBay: 'Studio Bay A - White Cyclorama',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      projectId: projects[0]?.id || '',
      customerId: customers[0]?.id || '',
      bookedBy: 'Production Head',
      purpose: 'Fashion Lookbook Shoot',
      cost: '35000',
      status: 'CONFIRMED',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBooking(b);
    setForm({
      studioBay: b.studioBay,
      date: b.date ? b.date.split('T')[0] : '',
      startTime: b.startTime || '',
      endTime: b.endTime || '',
      projectId: b.projectId || '',
      customerId: b.customerId || '',
      bookedBy: b.bookedBy || '',
      purpose: b.purpose || '',
      cost: b.cost ? String(b.cost) : '',
      status: b.status || 'CONFIRMED',
      notes: b.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studioBay || !form.date) {
      toast.error('Studio Bay and Date are required');
      return;
    }

    try {
      if (editingBooking) {
        await bookingApi.update(editingBooking.id, {
          ...form,
          cost: form.cost ? Number(form.cost) : null,
          projectId: form.projectId || null,
          customerId: form.customerId || null,
        });
        toast.success('Studio booking updated');
      } else {
        await bookingApi.create({
          ...form,
          cost: form.cost ? Number(form.cost) : null,
          projectId: form.projectId || null,
          customerId: form.customerId || null,
        });
        toast.success('Studio booking confirmed');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving booking');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancel this studio bay booking?')) return;
    try {
      await bookingApi.delete(id);
      toast.success('Booking cancelled');
      load();
    } catch {
      toast.error('Failed to delete booking');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Studio Bay Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and allocate studio floors, cyclorama bays, and lighting rigs</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Book Studio Bay
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Studio Bay</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Project / Campaign</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4 text-right">Bay Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-purple-700 font-semibold">{b.bookingNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{b.studioBay}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">
                      <div className="font-medium text-gray-900">{formatDate(b.date)}</div>
                      <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {b.startTime} - {b.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">
                      {b.project?.name || b.customer?.fullName || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{b.purpose}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 text-xs">
                      {b.cost ? formatCurrency(b.cost) : 'Included'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
            <p className="text-base font-semibold text-gray-700">No studio bookings scheduled</p>
            <p className="text-xs text-gray-400 mt-1">Book studio bays, daylight stages, and cycloramas for your shoots.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Book First Slot
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBooking ? 'Edit Studio Bay Booking' : 'Book Studio Bay Slot'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Studio Bay *</label>
              <select
                value={form.studioBay}
                onChange={(e) => setForm({ ...form, studioBay: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="Studio Bay A - White Cyclorama">Studio Bay A - White Cyclorama</option>
                <option value="Studio Bay B - Daylight Loft">Studio Bay B - Daylight Loft</option>
                <option value="Studio Bay C - Black Box Theater">Studio Bay C - Black Box Theater</option>
                <option value="Outdoor Fashion Set">Outdoor Fashion Set</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="text"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="text"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                placeholder="06:00 PM"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Associated Fashion Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">-- Standalone Booking / No Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client / Brand</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">-- Select Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} {c.companyName ? `(${c.companyName})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rental Cost (₹)</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="35000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="TENTATIVE">Tentative Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Purpose / Shoot Details</label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. Campaign Lookbook 2026, 4 Model setups"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all"
            >
              Save Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
