import { useEffect, useState } from 'react';
import { Plus, Search, UserCircle, Phone, Mail, Trash2, Edit2 } from 'lucide-react';
import { modelApi, formatCurrency } from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function FashionModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    agency: '',
    phone: '',
    email: '',
    instagram: '',
    gender: 'Female',
    height: "5'8\"",
    measurements: '34-26-36',
    dayRate: '',
    status: 'AVAILABLE',
    notes: '',
  });

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

  useEffect(() => {
    load();
  }, [search]);

  const openCreateModal = () => {
    setEditingModel(null);
    setForm({
      name: '',
      agency: '',
      phone: '',
      email: '',
      instagram: '',
      gender: 'Female',
      height: "5'8\"",
      measurements: '34-26-36',
      dayRate: '',
      status: 'AVAILABLE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: any) => {
    setEditingModel(m);
    setForm({
      name: m.name,
      agency: m.agency || '',
      phone: m.phone || '',
      email: m.email || '',
      instagram: m.instagram || '',
      gender: m.gender || 'Female',
      height: m.height || '',
      measurements: m.measurements || '',
      dayRate: m.dayRate ? String(m.dayRate) : '',
      status: m.status || 'AVAILABLE',
      notes: m.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Model name is required');
      return;
    }

    try {
      if (editingModel) {
        await modelApi.update(editingModel.id, form);
        toast.success('Model profile updated');
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove model ${name}?`)) return;
    try {
      await modelApi.delete(id);
      toast.success('Model removed');
      load();
    } catch {
      toast.error('Failed to delete model');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fashion Model Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage models, agencies, measurements, and shoot day rates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm w-full focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by name, agency, handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : models.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Agency</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Physical Stats</th>
                  <th className="py-3 px-4">Day Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div>{m.name}</div>
                          {m.instagram && (
                            <div className="text-[11px] text-purple-600 font-normal">@{m.instagram}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{m.agency || 'Independent'}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <div>{m.phone || '-'}</div>
                      <div className="text-gray-400 text-[11px]">{m.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <div>Height: {m.height || '-'}</div>
                      <div className="text-gray-400 text-[11px]">Stats: {m.measurements || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 text-sm">
                      {m.dayRate ? `${formatCurrency(m.dayRate)}/day` : 'Negotiable'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        m.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
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
            <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
            <p className="text-base font-semibold text-gray-700">No models in roster</p>
            <p className="text-xs text-gray-400 mt-1">Add models to manage lookbooks and campaign casting.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Add First Model
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModel ? 'Edit Model Profile' : 'Add Model to Roster'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency / Representation</label>
              <input
                type="text"
                value={form.agency}
                onChange={(e) => setForm({ ...form, agency: e.target.value })}
                placeholder="e.g. Elite Models / Freelance"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98111 22233"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Instagram Handle</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="e.g. elena_model"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
              <input
                type="text"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="5ft 9in"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Measurements</label>
              <input
                type="text"
                value={form.measurements}
                onChange={(e) => setForm({ ...form, measurements: e.target.value })}
                placeholder="34-26-36"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Day Rate (₹)</label>
              <input
                type="number"
                value={form.dayRate}
                onChange={(e) => setForm({ ...form, dayRate: e.target.value })}
                placeholder="25000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Availability Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="AVAILABLE">Available</option>
                <option value="BOOKED">Booked</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Lookbook specialties, portfolio link, dietary/travel notes..."
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
              Save Model
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
