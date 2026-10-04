import React, { useEffect, useState } from 'react';
import { Plus, UsersRound, Search, Edit2, Trash2, Phone, Mail, Sparkles, Filter, CalendarDays, Check, Briefcase } from 'lucide-react';
import { employeeApi, eventApi, projectApi } from '../../services/api';
import Modal from '../../components/ui/Modal';
import { getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';

export const WEDDING_ROLES = [
  { value: 'TRADITIONAL_PHOTOGRAPHER', label: 'Traditional Photographer' },
  { value: 'TRADITIONAL_VIDEOGRAPHER', label: 'Traditional Videographer' },
  { value: 'CANDID_PHOTOGRAPHER', label: 'Candid Photographer' },
  { value: 'CINEMATIC_VIDEOGRAPHER', label: 'Cinematic Videographer' },
  { value: 'DRONE', label: 'Drone' },
  { value: 'MOBILE_CONTENT_CREATOR', label: 'Mobile Content Creator' },
  { value: 'TRADITIONAL_PHOTO_EDITOR', label: 'Traditional Photo Editor' },
  { value: 'TRADITIONAL_VIDEO_EDITOR', label: 'Traditional Video Editor' },
  { value: 'CANDID_PHOTO_EDITOR', label: 'Candid Photo Editor' },
  { value: 'CINEMATIC_VIDEO_EDITOR', label: 'Cinematic Video Editor' },
  { value: 'DRONE_EDITOR', label: 'Drone Editor' },
  { value: 'MOBILE_REEL_CONTENT_EDITOR', label: 'Mobile/Reel Content Editor' },
];

export const FASHION_ROLES = [
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'VIDEOGRAPHER', label: 'Videographer' },
  { value: 'PHOTO_EDITOR', label: 'Photo editor' },
  { value: 'VIDEO_EDITOR', label: 'Video editor' },
  { value: 'SALES_PERSON', label: 'Sale person' },
  { value: 'ACCOUNTS', label: 'Accounts' },
  { value: 'PRODUCT_MANAGER', label: 'Product manager' },
  { value: 'STEEM_BOY', label: 'Steem boy' },
  { value: 'HELPING_HAND', label: 'Helping hand' },
  { value: 'ROTE_BOY', label: 'Rote boy' },
  { value: 'MAKEUP_ARTIST', label: 'Makeup artist' },
  { value: 'STYLIST', label: 'Stylist' },
  { value: 'SHOOT_MANAGER', label: 'Shoot manager' },
];

const ALL_ROLES = [...WEDDING_ROLES, ...FASHION_ROLES];

export default function TeamPage({ domain = 'WEDDING' }: { domain?: 'WEDDING' | 'FASHION' }) {
  const isFashion = domain === 'FASHION';
  const activeRoles = isFashion ? FASHION_ROLES : WEDDING_ROLES;

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Multiple roles state in form
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    roles: [activeRoles[0]?.value || 'PHOTOGRAPHER'] as string[],
    specialization: '',
    availability: 'Full Time',
    domain: domain,
  });

  // Assign Work Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningEmployee, setAssigningEmployee] = useState<any>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({
    projectId: '',
    eventId: '',
    role: '',
    notes: '',
  });
  const [assigning, setAssigning] = useState(false);

  const formatRole = (role?: string) => {
    if (!role) return '';
    const match = ALL_ROLES.find(
      (r) => r.value === role || r.label.toLowerCase() === role.toLowerCase()
    );
    if (match) return match.label;
    return role.replace(/_/g, ' ');
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await employeeApi.getAll({ domain });
      setEmployees(data.data || []);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [domain]);

  const openAdd = () => {
    setEditingEmployee(null);
    setForm({
      name: '',
      phone: '',
      email: '',
      roles: [activeRoles[0]?.value || 'PHOTOGRAPHER'],
      specialization: '',
      availability: 'Full Time',
      domain: domain,
    });
    setShowModal(true);
  };

  const openEdit = (emp: any) => {
    setEditingEmployee(emp);
    const existingRoles = emp.specialization
      ? emp.specialization.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [emp.role || activeRoles[0]?.value];

    setForm({
      name: emp.name || '',
      phone: emp.phone || '',
      email: emp.email || '',
      roles: existingRoles.length > 0 ? existingRoles : [activeRoles[0]?.value],
      specialization: emp.specialization || '',
      availability: emp.availability || 'Full Time',
      domain: emp.domain || domain,
    });
    setShowModal(true);
  };

  const toggleRoleSelection = (roleVal: string) => {
    setForm((prev) => {
      const has = prev.roles.includes(roleVal);
      const updated = has
        ? prev.roles.filter((r) => r !== roleVal)
        : [...prev.roles, roleVal];
      return {
        ...prev,
        roles: updated.length === 0 ? [roleVal] : updated,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Please enter employee name');
      return;
    }
    if (form.roles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      role: form.roles[0],
      specialization: form.roles.join(', '),
      availability: form.availability,
      domain,
    };

    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, payload);
        toast.success('Employee updated successfully!');
      } else {
        await employeeApi.create(payload);
        toast.success('Employee added successfully!');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const openAssignModal = async (emp: any) => {
    setAssigningEmployee(emp);
    setAssignForm({
      projectId: '',
      eventId: '',
      role: emp.role || 'PHOTOGRAPHER',
      notes: '',
    });
    setAssignModalOpen(true);
    try {
      const [projRes, evtRes] = await Promise.all([
        projectApi.getAll({ type: domain }),
        eventApi.getAll(),
      ]);
      setAvailableProjects(projRes.data?.data || []);
      setAvailableEvents(evtRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load projects/events', err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.eventId) {
      toast.error('Please select an event / shoot');
      return;
    }
    setAssigning(true);
    try {
      await eventApi.addAssignment(assignForm.eventId, {
        employeeId: assigningEmployee.id,
        role: assignForm.role,
        notes: assignForm.notes,
      });
      toast.success(`Assigned ${assigningEmployee.name} successfully!`);
      setAssignModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign work');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (emp: any) => {
    if (!window.confirm(`Deactivate ${emp.name} from the ${isFashion ? 'fashion' : 'wedding'} team?`)) return;
    try {
      await employeeApi.delete(emp.id);
      toast.success('Employee deactivated');
      load();
    } catch {
      toast.error('Failed to deactivate employee');
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.name?.toLowerCase().includes(q) ||
      e.phone?.includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q);
    const matchesRole = !roleFilter || e.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                isFashion
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isFashion ? 'Studio Fashion' : 'Wedding Studio'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            {isFashion ? 'Fashion Shoot Employees' : 'Wedding Studio Employees'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isFashion
              ? 'Photographers, videographers, editors, stylists, accounts, and shoot crew'
              : 'Traditional & candid photographers, cinematographers, drone pilots, and editors'}
          </p>
        </div>

        <button
          onClick={openAdd}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all cursor-pointer ${
            isFashion
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-[#C59B27] hover:bg-[#b58c1e]'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add {isFashion ? 'Fashion' : 'Wedding'} Employee</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 max-w-sm w-full focus-within:border-[#C59B27] transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by name, phone, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#C59B27]"
          >
            <option value="">All Roles ({activeRoles.length})</option>
            {activeRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ${
                        isFashion
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                          : 'bg-gradient-to-br from-[#C59B27] to-[#8C6910]'
                      }`}
                    >
                      {getInitials(e.name)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{e.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(() => {
                          const roleList = e.specialization
                            ? e.specialization.split(',').map((s: string) => s.trim()).filter(Boolean)
                            : [e.role];
                          return roleList.map((r: string, idx: number) => (
                            <span
                              key={idx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                                isFashion
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {formatRole(r)}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(e)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(e)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                  {e.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{e.phone}</span>
                    </div>
                  )}
                  {e.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{e.email}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Work & Shoots */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5 text-[#C59B27]" />
                      Assigned Work ({e.assignments?.length || 0})
                    </span>
                    <button
                      onClick={() => openAssignModal(e)}
                      className="text-[11px] text-[#C59B27] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Assign Work
                    </button>
                  </div>

                  {e.assignments && e.assignments.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {e.assignments.map((asg: any) => {
                        const evt = asg.event;
                        const projName = evt?.project?.name || evt?.customer?.fullName || 'Project';
                        const shootName = evt?.eventName || 'Shoot';
                        return (
                          <div
                            key={asg.id}
                            className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-gray-800"
                          >
                            <div className="font-semibold text-gray-900 flex items-center justify-between">
                              <span>
                                {shootName} <span className="text-gray-400">→</span>{' '}
                                <span className="text-[#9A7318]">{projName}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                              <span className="bg-white/80 border border-amber-200 px-1.5 py-0.5 rounded text-[#8C6910] font-medium">
                                {asg.role ? asg.role.replace(/_/g, ' ') : 'Crew'}
                              </span>
                              {evt?.startDate && (
                                <span>📅 {new Date(evt.startDate).toLocaleDateString('en-IN')}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic bg-gray-50/70 p-2 rounded-lg border border-dashed border-gray-200">
                      No shoots assigned currently. Click "+ Assign Work" to assign him to a shoot.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <span>{e.availability || 'Full Time'}</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      e.isActive !== false ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="font-semibold text-gray-700">
                    {e.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <UsersRound className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-base font-semibold text-gray-700">No employees found</p>
          <p className="text-xs text-gray-400 mt-1">
            Add your first {isFashion ? 'fashion' : 'wedding'} team member to assign them to shoots and tasks.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Add Member
          </button>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmployee ? `Edit Member: ${editingEmployee.name}` : `Add ${isFashion ? 'Fashion' : 'Wedding'} Member`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="rahul@studio.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Availability</label>
              <select
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              >
                <option value="Full Time">Full Time</option>
                <option value="Freelance">Freelance / On-Call</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>

            {/* Multiple Role Selection */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Select Roles (Multiple Selection Allowed) *
                </label>
                <span className="text-[11px] text-gray-500">
                  {form.roles.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                {activeRoles.map((r) => {
                  const isChecked = form.roles.includes(r.value);
                  return (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        isChecked
                          ? isFashion
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                            : 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRoleSelection(r.value)}
                        className={isFashion ? 'accent-purple-600' : 'accent-[#C59B27]'}
                      />
                      <span className="truncate">{r.label}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[11px] text-gray-500 mr-1 self-center">Selected:</span>
                {form.roles.map((rv) => (
                  <span
                    key={rv}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isFashion
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {formatRole(rv)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                isFashion
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-[#C59B27] hover:bg-[#b58c1e]'
              }`}
            >
              {editingEmployee ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Work Modal */}
      {assignModalOpen && assigningEmployee && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title={`Assign Work — ${assigningEmployee.name}`}
          size="md"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Project / Wedding *
              </label>
              <select
                required
                value={assignForm.projectId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setAssignForm({ ...assignForm, projectId: pId, eventId: '' });
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              >
                <option value="">— Select Project —</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Shoot / Event *
              </label>
              <select
                required
                value={assignForm.eventId}
                onChange={(e) => setAssignForm({ ...assignForm, eventId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              >
                <option value="">— Select Shoot / Event —</option>
                {availableEvents
                  .filter((ev) => !assignForm.projectId || ev.projectId === assignForm.projectId)
                  .map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.eventName || 'Shoot'} ({ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-IN') : 'Date TBD'})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Role for this Shoot *
              </label>
              <select
                required
                value={assignForm.role}
                onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              >
                {activeRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Instructions / Call Time (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Call time 8:00 AM at venue"
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

