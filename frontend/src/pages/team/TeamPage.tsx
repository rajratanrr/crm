import { useEffect, useState } from 'react';
import { Plus, UsersRound } from 'lucide-react';
import { employeeApi } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';

const roles = ['PHOTOGRAPHER','VIDEOGRAPHER','DRONE_OPERATOR','EDITOR','ALBUM_DESIGNER','MANAGER','SALES_EXECUTIVE','ACCOUNTANT','OTHER'];

export default function TeamPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'PHOTOGRAPHER', specialization: '', availability: 'Full Time' });

  const load = async () => { try { const { data } = await employeeApi.getAll(); setEmployees(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await employeeApi.create(form); toast.success('Employee added!'); setShowModal(false); load(); } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Team</h2><p className="text-sm text-gray-500">Manage your studio team</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Add Member</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold">{getInitials(e.name)}</div>
              <div><p className="font-semibold text-gray-900">{e.name}</p><p className="text-xs text-gray-500">{e.role?.replace(/_/g, ' ')}</p></div>
              {e.isActive ? <span className="ml-auto w-2 h-2 rounded-full bg-green-400" /> : <span className="ml-auto w-2 h-2 rounded-full bg-gray-300" />}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📞 {e.phone}</p>
              {e.email && <p>📧 {e.email}</p>}
              {e.specialization && <p>🎯 {e.specialization}</p>}
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>{e._count?.assignments || 0} events</span>
              <span>{e._count?.tasks || 0} tasks</span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Team Member" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Member</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
