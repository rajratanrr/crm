import { useEffect, useState } from 'react';
import {
  Plus, Search, UserCircle, Trash2, Edit2, X, Mail, Phone, Instagram,
  Ruler, Building2, History, IndianRupee, Calendar, ChevronRight,
} from 'lucide-react';
import { modelApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-Binary', 'Other'];

function defaultForm() {
  return {
    name: '',
    agency: '',
    phone: '',
    email: '',
    instagram: '',
    gender: 'Female',
    height: '',
    measurements: '',
    notes: '',
  };
}

export default function FashionModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [form, setForm] = useState(defaultForm());
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [modelDetail, setModelDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await modelApi.getAll({ search });
      setModels(data.data);
    } catch {
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const loadDetail = async (model: any) => {
    setSelectedModel(model);
    setDetailLoading(true);
    try {
      const { data } = await modelApi.getOne(model.id);
      setModelDetail(data.data);
    } catch {
      toast.error('Failed to load model details');
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingModel(null);
    setForm(defaultForm());
    setIsModalOpen(true);
  };

  const openEditModal = (m: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModel(m);
    setForm({
      name: m.name || '',
      agency: m.agency || '',
      phone: m.phone || '',
      email: m.email || '',
      instagram: m.instagram || '',
      gender: m.gender || 'Female',
      height: m.height || '',
      measurements: m.measurements || '',
      notes: m.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Model name is required'); return; }
    try {
      if (editingModel) {
        await modelApi.update(editingModel.id, form);
        toast.success('Model profile updated');
        // Refresh detail panel if this model is currently selected
        if (selectedModel?.id === editingModel.id) {
          loadDetail(editingModel);
        }
      } else {
        await modelApi.create(form);
        toast.success('Model added to roster');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving model');
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Remove model ${name} from roster? This does not delete their project history.`)) return;
    try {
      await modelApi.delete(id);
      toast.success('Model removed');
      if (selectedModel?.id === id) { setSelectedModel(null); setModelDetail(null); }
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting model');
    }
  };

  const filtered = models.filter((m) =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.agency?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Fashion Models
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {models.length} model{models.length !== 1 ? 's' : ''} in roster
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Model
        </button>
      </div>

      {/* Body — split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r overflow-hidden"
          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          {/* Search */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-secondary)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models…"
                className="input w-full pl-8 py-2 text-sm"
              />
            </div>
          </div>

          {/* Model list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <UserCircle size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No models yet</p>
                <button onClick={openCreateModal} className="btn-primary mt-3 text-xs py-1.5 px-3">
                  + Add First Model
                </button>
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  onClick={() => loadDetail(m)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors group ${selectedModel?.id === m.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  style={{ borderBottomColor: 'var(--color-border)' }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                    style={{ background: 'var(--color-accent)', color: 'white' }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {m.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {m.agency || m.gender || 'No agency'}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditModal(m, e)}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                      <Edit2 size={13} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                    <button onClick={(e) => handleDelete(m.id, m.name, e)}
                      className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} className="flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedModel ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <UserCircle size={56} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a model to view their profile</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
          ) : modelDetail ? (
            <ModelDetail
              model={modelDetail}
              onEdit={(e) => openEditModal(modelDetail, e)}
              onDelete={(e) => handleDelete(modelDetail.id, modelDetail.name, e)}
            />
          ) : null}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingModel ? 'Edit Model Profile' : 'Add New Model'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Full Name *</label>
              <input className="input w-full" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Sharma" required />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select className="input w-full" value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Agency / Representation</label>
              <input className="input w-full" value={form.agency}
                onChange={(e) => setForm({ ...form, agency: e.target.value })}
                placeholder="e.g. Elite Models" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="input w-full" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="input w-full" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="model@email.com" />
            </div>
            <div>
              <label className="form-label">Instagram Handle</label>
              <input className="input w-full" value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@username" />
            </div>
            <div>
              <label className="form-label">Height</label>
              <input className="input w-full" value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="e.g. 5'7&quot;" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Measurements</label>
              <input className="input w-full" value={form.measurements}
                onChange={(e) => setForm({ ...form, measurements: e.target.value })}
                placeholder="e.g. 34-26-36" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Notes</label>
              <textarea className="input w-full" rows={3} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes…" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editingModel ? 'Save Changes' : 'Add Model'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ModelDetail({ model, onEdit, onDelete }: { model: any; onEdit: (e: React.MouseEvent) => void; onDelete: (e: React.MouseEvent) => void }) {
  const assignments = model.projectAssignments || [];
  const totalEarned = assignments.reduce((s: number, a: any) => s + Number(a.modelRate || 0), 0);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ background: 'var(--color-accent)', color: 'white' }}>
              {model.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{model.name}</h2>
              {model.agency && (
                <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Building2 size={13} /> {model.agency}
                </div>
              )}
              {model.gender && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  {model.gender}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
              <Edit2 size={13} /> Edit
            </button>
            <button onClick={onDelete} className="flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              style={{ borderColor: 'var(--color-border)' }}>
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {model.phone && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Phone size={14} /> {model.phone}
            </div>
          )}
          {model.email && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Mail size={14} /> {model.email}
            </div>
          )}
          {model.instagram && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Instagram size={14} /> {model.instagram}
            </div>
          )}
          {model.height && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Ruler size={14} /> {model.height}
            </div>
          )}
          {model.measurements && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Ruler size={14} /> {model.measurements}
            </div>
          )}
        </div>
        {model.notes && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
            {model.notes}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Shoots', value: assignments.length, icon: History },
          { label: 'Total Earnings', value: formatCurrency(totalEarned), icon: IndianRupee },
          { label: 'Last Shoot', value: assignments[0]?.project?.shootDate ? formatDate(assignments[0].project.shootDate) : '—', icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={20} className="mx-auto mb-1" style={{ color: 'var(--color-accent)' }} />
            <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Project History */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <History size={16} /> Project History
        </h3>
        {assignments.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No projects yet. This model will appear in project model dropdowns.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left pb-2 pr-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Project</th>
                  <th className="text-left pb-2 pr-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Client</th>
                  <th className="text-left pb-2 pr-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Shoot Date</th>
                  <th className="text-right pb-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Model Price</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="py-3 pr-4" style={{ color: 'var(--color-text-primary)' }}>
                      <div className="font-medium">{a.project?.name || '—'}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {a.project?.projectNumber}
                      </div>
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {a.project?.customer?.companyName || a.project?.customer?.fullName || '—'}
                    </td>
                    <td className="py-3 pr-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {a.project?.shootDate ? formatDate(a.project.shootDate) : '—'}
                    </td>
                    <td className="py-3 text-right font-semibold" style={{ color: 'var(--color-accent)' }}>
                      {formatCurrency(a.modelRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
