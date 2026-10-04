import { useEffect, useState, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, Edit2, Trash2, CalendarDays, X } from 'lucide-react';
import { bookingApi, projectApi, customerApi, formatCurrency, formatDate } from '../../services/api';
import { useAutoSync } from '../../hooks/useAutoSync';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const BAYS = ['2nd Floor', 'Meraki'];
const BAY_COLORS: Record<string, string> = {
  '2nd Floor': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Meraki':    'bg-purple-100 text-purple-700 border-purple-200',
};
const BAY_DOT: Record<string, string> = {
  '2nd Floor': 'bg-indigo-500',
  'Meraki':    'bg-purple-500',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function FashionBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const [form, setForm] = useState({
    studioBay: '2nd Floor',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    projectId: '',
    customerId: '',
    bookedBy: '',
    purpose: '',
    cost: '',
    status: 'CONFIRMED',
    notes: '',
  });

  const load = useCallback(async () => {
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
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useAutoSync(load, 10000);

  const bookingsByDate: Record<string, any[]> = {};
  bookings.forEach((b) => {
    const key = b.date ? b.date.split('T')[0] : '';
    if (key) {
      if (!bookingsByDate[key]) bookingsByDate[key] = [];
      bookingsByDate[key].push(b);
    }
  });

  const selectedDateStr = selectedDay
    ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedBookings = selectedDateStr ? (bookingsByDate[selectedDateStr] || []) : [];

  const openCreateModal = (dateStr?: string) => {
    setEditingBooking(null);
    setForm({
      studioBay: '2nd Floor',
      date: dateStr || new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      projectId: projects[0]?.id || '',
      customerId: customers[0]?.id || '',
      bookedBy: '',
      purpose: '',
      cost: '',
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
    if (!form.studioBay || !form.date) { toast.error('Studio Bay and Date are required'); return; }
    try {
      if (editingBooking) {
        await bookingApi.update(editingBooking.id, { ...form, cost: form.cost ? Number(form.cost) : null, projectId: form.projectId || null, customerId: form.customerId || null });
        toast.success('Booking updated');
      } else {
        await bookingApi.create({ ...form, cost: form.cost ? Number(form.cost) : null, projectId: form.projectId || null, customerId: form.customerId || null });
        toast.success('Booking confirmed');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving booking');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancel this studio bay booking?')) return;
    try { await bookingApi.delete(id); toast.success('Booking cancelled'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDow = getFirstDayOfWeek(calYear, calMonth);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Studio Calendar (For Rent)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage studio rentals — 2nd Floor & Meraki</p>
        </div>
        <button
          onClick={() => openCreateModal(selectedDateStr || undefined)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Book Studio Rental
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {BAYS.map(b => (
          <span key={b} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${BAY_DOT[b]}`} />
            <span className="text-gray-600 font-medium">{b}</span>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-base font-bold text-gray-900">{MONTHS[calMonth]} {calYear}</h2>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-[72px] border-b border-r border-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const dayBookings = bookingsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isSelected = selectedDay === day;
                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[72px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors
                      ${isSelected ? 'bg-amber-50 ring-2 ring-inset ring-[#C59B27]' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${isToday ? 'bg-[#C59B27] text-white' : isSelected ? 'text-[#C59B27]' : 'text-gray-700'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 2).map((b, i) => (
                        <div key={i} className={`text-[10px] font-semibold px-1 py-0.5 rounded truncate border ${BAY_COLORS[b.studioBay] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {b.studioBay}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-[10px] text-gray-400 font-medium">+{dayBookings.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDay && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#C59B27]" />
                  <h3 className="text-sm font-bold text-gray-900">
                    {selectedDay} {MONTHS[calMonth]} {calYear}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {selectedBookings.length === 0 ? '— No bookings' : `— ${selectedBookings.length} booking${selectedBookings.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCreateModal(selectedDateStr || undefined)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#C59B27] text-white rounded-lg font-semibold hover:bg-[#b58c1e] transition-all"
                  >
                    <Plus className="w-3 h-3" /> Book this day
                  </button>
                  <button onClick={() => setSelectedDay(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              {selectedBookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-20 text-purple-600" />
                  <p className="text-sm font-medium text-gray-500">No bookings on this day</p>
                  <button
                    onClick={() => openCreateModal(selectedDateStr || undefined)}
                    className="mt-3 px-4 py-1.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-lg transition-all"
                  >Book First Slot</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {selectedBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${BAY_COLORS[b.studioBay] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {b.studioBay}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{b.purpose || '—'}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {b.startTime} – {b.endTime}
                            {(b.project?.name || b.customer?.fullName) && (
                              <span className="ml-2 text-gray-500">· {b.project?.name || b.customer?.fullName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {b.cost && <span className="text-sm font-bold text-gray-900">{formatCurrency(b.cost)}</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider
                          ${b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            b.status === 'TENTATIVE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-red-50 text-red-700 border border-red-200'}`}>
                          {b.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(b)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBooking ? 'Edit Studio Rental Booking' : 'Book Studio Rental (For Rent)'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Studio Bay *</label>
              <select value={form.studioBay} onChange={(e) => setForm({ ...form, studioBay: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]">
                <option value="2nd Floor">2nd Floor</option>
                <option value="Meraki">Meraki</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
              <input type="text" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                placeholder="09:00 AM" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
              <input type="text" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                placeholder="06:00 PM" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client / Brand</label>
              <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]">
                <option value="">-- Select Client --</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.fullName} {c.companyName ? `(${c.companyName})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rental Cost (₹)</label>
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="35000" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]">
                <option value="CONFIRMED">Confirmed</option>
                <option value="TENTATIVE">Tentative Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Purpose / Shoot Details</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. Campaign Lookbook 2026, 4 Model setups"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all">
              Save Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
