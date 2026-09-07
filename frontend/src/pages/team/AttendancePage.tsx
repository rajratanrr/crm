import { useEffect, useState } from 'react';
import { Plus, ClipboardList, CheckCircle2, XCircle, Clock, Trash2, Calendar } from 'lucide-react';
import { attendanceApi, employeeApi, formatDate } from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    checkIn: '09:30 AM',
    checkOut: '06:30 PM',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, eRes] = await Promise.all([
        attendanceApi.getAll({ date: selectedDate }),
        employeeApi.getAll(),
      ]);
      setAttendances(aRes.data.data);
      setEmployees(eRes.data.data);
      if (eRes.data.data.length > 0 && !form.employeeId) {
        setForm((f) => ({ ...f, employeeId: eRes.data.data[0].id }));
      }
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.date) {
      toast.error('Employee and Date are required');
      return;
    }

    try {
      await attendanceApi.mark(form);
      toast.success('Attendance recorded');
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving attendance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete attendance record?')) return;
    try {
      await attendanceApi.delete(id);
      toast.success('Record deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
  const leaveCount = attendances.filter((a) => a.status === 'LEAVE' || a.status === 'HALF_DAY').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff & Crew Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track daily shift check-ins, leaves, and shoot call-time compliance</p>
        </div>
        <button
          onClick={() => {
            setForm((f) => ({ ...f, date: selectedDate }));
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Mark Attendance
        </button>
      </div>

      {/* Date selector & metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#C59B27]" />
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase">Selected Date</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-bold text-gray-900 border-none outline-none cursor-pointer bg-transparent mt-0.5"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Present Today</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{presentCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Absent</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{absentCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Leave / Half-Day</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{leaveCount}</p>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : attendances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Employee / Crew Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {a.employee?.name}
                      <div className="text-xs text-gray-400 font-normal">{a.employee?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{a.employee?.role?.replace(/_/g, ' ')}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-700 font-medium">{a.checkIn || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-700 font-medium">{a.checkOut || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        a.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : a.status === 'ABSENT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{a.notes || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No attendance marked for {formatDate(selectedDate)}</p>
            <p className="text-xs text-gray-400 mt-1">Mark staff presence or check-in times for today's roster.</p>
            <button
              onClick={() => {
                setForm((f) => ({ ...f, date: selectedDate }));
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Mark Attendance
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Employee Attendance">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Employee *</label>
              <select
                required
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role?.replace(/_/g, ' ')})</option>
                ))}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Attendance Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LEAVE">Approved Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Check-in Time</label>
              <input
                type="text"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                placeholder="09:30 AM"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks / Shift Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Assigned to Destination Wedding shoot call-time"
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
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
