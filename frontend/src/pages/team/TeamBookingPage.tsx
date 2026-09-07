import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Users,
  Search,
  Plus,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Phone,
  Mail,
  Camera,
  Heart,
  Shirt,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { employeeApi, eventApi, projectApi } from '../../services/api';
import { formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function TeamBookingPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    eventId: '',
    employeeId: '',
    role: 'PHOTOGRAPHER',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, evtRes, projRes] = await Promise.all([
        employeeApi.getAll(),
        eventApi.getAll(),
        projectApi.getAll(),
      ]);
      setEmployees(empRes.data.data || []);
      setEvents(evtRes.data.data || []);
      setProjects(projRes.data.data || []);
    } catch (err) {
      console.error('Failed to load team booking data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Collect all assignments across events
  const allAssignments: any[] = [];
  events.forEach((evt) => {
    if (evt.assignments && Array.isArray(evt.assignments)) {
      evt.assignments.forEach((asg: any) => {
        allAssignments.push({
          ...asg,
          event: evt,
        });
      });
    }
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventId || !form.employeeId) {
      toast.error('Please select both an event and a crew member');
      return;
    }
    setSubmitting(true);
    try {
      await eventApi.addAssignment(form.eventId, {
        employeeId: form.employeeId,
        role: form.role,
        notes: form.notes,
      });
      toast.success('Crew assigned successfully!');
      setShowModal(false);
      setForm({ eventId: '', employeeId: '', role: 'PHOTOGRAPHER', notes: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (eventId: string, assignmentId: string) => {
    if (!confirm('Remove this crew assignment?')) return;
    try {
      await eventApi.removeAssignment(eventId, assignmentId);
      toast.success('Assignment removed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      emp.role?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Team Booking & Shoot Rosters
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/30">
              IPC Crew
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Schedule photographers, videographers, editors & crew to Wedding & Fashion shoots
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#B3891F] text-white rounded-xl text-sm font-semibold shadow-sm shadow-[#C59B27]/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Book Crew Member
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Crew</p>
            <p className="text-lg font-bold text-gray-900">{employees.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Active Shoot Bookings</p>
            <p className="text-lg font-bold text-gray-900">{allAssignments.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Photographers</p>
            <p className="text-lg font-bold text-gray-900">
              {employees.filter((e) => e.role === 'PHOTOGRAPHER').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Scheduled Events</p>
            <p className="text-lg font-bold text-gray-900">{events.length}</p>
          </div>
        </div>
      </div>

      {/* Roster & Scheduled Assignments Tabs */}
      <div className="space-y-4">
        {/* Scheduled Assignments Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#C59B27]" />
              <h2 className="text-sm font-bold text-gray-900">Current Shoot Assignments</h2>
              <span className="text-xs text-gray-500 font-normal">
                ({allAssignments.length} scheduled)
              </span>
            </div>
          </div>

          {allAssignments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No crew assignments recorded yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 text-xs font-semibold text-[#9A7318] hover:underline"
              >
                + Assign your first crew member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Crew Member</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Shoot / Event</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {allAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {asg.employee?.name || 'Assigned Crew'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {asg.role?.replace(/_/g, ' ') || 'CREW'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {asg.event?.eventName || 'Shoot Event'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(asg.event?.startDate)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {asg.event?.venue || asg.event?.city || 'Studio'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">
                        {asg.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveAssignment(asg.eventId, asg.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Unassign member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Crew Availability Roster */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C59B27]" />
                Studio Crew Roster & Availability
              </h2>
              <p className="text-xs text-gray-500">
                View photographers, videographers, editors and their current workload
              </p>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search crew..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C59B27] w-44"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C59B27] bg-white font-medium"
              >
                <option value="ALL">All Roles</option>
                <option value="PHOTOGRAPHER">Photographers</option>
                <option value="VIDEOGRAPHER">Videographers</option>
                <option value="DRONE_OPERATOR">Drone Operators</option>
                <option value="EDITOR">Editors</option>
                <option value="ALBUM_DESIGNER">Album Designers</option>
                <option value="MANAGER">Managers</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-white hover:border-[#C59B27]/40 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {emp.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{emp.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {emp.role?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      emp.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                    title={emp.isActive ? 'Active' : 'Inactive'}
                  />
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{emp.phone || 'No phone'}</span>
                  </div>
                  {emp.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.specialization && (
                    <div className="text-[10px] text-[#9A7318] bg-[#FAF5EB] px-2 py-0.5 rounded font-medium mt-1 inline-block">
                      {emp.specialization}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                  <span>{emp._count?.assignments || 0} events assigned</span>
                  <button
                    onClick={() => {
                      setForm((f) => ({ ...f, employeeId: emp.id, role: emp.role }));
                      setShowModal(true);
                    }}
                    className="text-[#9A7318] font-semibold hover:underline"
                  >
                    + Book to shoot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book Crew Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Book Crew to Shoot" size="md">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Shoot / Event *
            </label>
            <select
              required
              value={form.eventId}
              onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#C59B27] outline-none"
            >
              <option value="">Select an Event</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.eventName} ({formatDate(evt.startDate)}) - {evt.eventType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Crew Member *
            </label>
            <select
              required
              value={form.employeeId}
              onChange={(e) => {
                const emp = employees.find((x) => x.id === e.target.value);
                setForm({
                  ...form,
                  employeeId: e.target.value,
                  role: emp?.role || form.role,
                });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#C59B27] outline-none"
            >
              <option value="">Select Crew Member</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role?.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Assignment Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#C59B27] outline-none"
            >
              <option value="PHOTOGRAPHER">Photographer</option>
              <option value="VIDEOGRAPHER">Videographer</option>
              <option value="DRONE_OPERATOR">Drone Operator</option>
              <option value="EDITOR">Editor</option>
              <option value="ALBUM_DESIGNER">Album Designer</option>
              <option value="MANAGER">Lead Manager</option>
              <option value="OTHER">Crew Assistant / Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Notes / Call Time / Instructions
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Call time 7:30 AM at venue. Bring prime 85mm & 24-70mm lenses."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#C59B27] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs bg-[#C59B27] hover:bg-[#B3891F] text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Confirm Shoot Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
