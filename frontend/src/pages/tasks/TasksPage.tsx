import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { taskApi, employeeApi, eventApi } from '../../services/api';
import { formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });

  const load = async () => {
    try { const { data } = await taskApi.getAll(filter !== 'ALL' ? { status: filter } : {}); setTasks(data.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);
  useEffect(() => { if (showModal) employeeApi.getAll().then(r => setEmployees(r.data.data)).catch(()=>{}); }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await taskApi.create(form); toast.success('Task created!'); setShowModal(false); load(); } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleStatusChange = async (id: string, status: string) => {
    try { await taskApi.updateStatus(id, status); toast.success('Updated'); load(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Tasks</h2><p className="text-sm text-gray-500">Track all studio tasks</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Add Task</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['ALL','TODO','IN_PROGRESS','COMPLETED','OVERDUE'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s.replace(/_/g, ' ')}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
          {['Task', 'Assigned To', 'Priority', 'Due Date', 'Event', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
        </tr></thead><tbody>
          {tasks.map((t: any) => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{t.title}</p><p className="text-xs text-gray-400 truncate max-w-[200px]">{t.description}</p></td>
              <td className="px-4 py-3 text-sm text-gray-600">{t.assignedEmployee?.name || '-'}</td>
              <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
              <td className="px-4 py-3 text-sm text-gray-600">{t.dueDate ? formatDate(t.dueDate) : '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{t.event?.eventName || '-'}</td>
              <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
              <td className="px-4 py-3">
                <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1">
                  {['TODO','IN_PROGRESS','COMPLETED','OVERDUE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </td>
            </tr>))}
        </tbody></table></div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Task" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select value={form.assignedTo} onChange={(e) => setForm({...form, assignedTo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
