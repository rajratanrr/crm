import { useEffect, useState } from 'react';
import { Plus, Search, Tag, Trash2, Edit2 } from 'lucide-react';
import { garmentApi } from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function FashionGarmentsPage() {
  const [garments, setGarments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<any>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    brand: '',
    category: 'Western Wear',
    size: 'M',
    color: '',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    shootReference: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await garmentApi.getAll({ search });
      setGarments(data.data);
    } catch {
      toast.error('Failed to load garments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const openCreateModal = () => {
    setEditingGarment(null);
    setForm({
      code: `GAR-${String(Date.now()).slice(-5)}`,
      name: '',
      brand: '',
      category: 'Western Wear',
      size: 'M',
      color: '',
      condition: 'EXCELLENT',
      status: 'AVAILABLE',
      shootReference: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (g: any) => {
    setEditingGarment(g);
    setForm({
      code: g.code,
      name: g.name,
      brand: g.brand || '',
      category: g.category || 'Western Wear',
      size: g.size || 'M',
      color: g.color || '',
      condition: g.condition || 'EXCELLENT',
      status: g.status || 'AVAILABLE',
      shootReference: g.shootReference || '',
      notes: g.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Garment name is required');
      return;
    }

    try {
      if (editingGarment) {
        await garmentApi.update(editingGarment.id, form);
        toast.success('Garment updated');
      } else {
        await garmentApi.create(form);
        toast.success('Garment added to inventory');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving garment');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete garment "${name}"?`)) return;
    try {
      await garmentApi.delete(id);
      toast.success('Garment deleted');
      load();
    } catch {
      toast.error('Failed to delete garment');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Garment & Wardrobe Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track outfits, styling pieces, designer samples, and shoot checkouts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Garment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm w-full focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search garments, codes, brands..."
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
        ) : garments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Garment Item</th>
                  <th className="py-3 px-4">Brand / Designer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size & Color</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {garments.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-purple-700 font-semibold">{g.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {g.name}
                      {g.shootReference && (
                        <div className="text-[11px] text-gray-400 font-normal">Shoot: {g.shootReference}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">{g.brand || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{g.category}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {g.size} &bull; {g.color || 'Multi'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {g.condition}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        g.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : g.status === 'IN_SHOOT'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {g.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(g)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.name)}
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
            <Tag className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
            <p className="text-base font-semibold text-gray-700">No garments in inventory</p>
            <p className="text-xs text-gray-400 mt-1">Catalog styling wardrobe items and track their shoot checkout status.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Add First Garment
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGarment ? 'Edit Garment' : 'Add Garment to Inventory'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Garment Item Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Silk Velvet Blazer"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Brand / Designer</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Zara / Rohit Bal"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="Western Wear">Western Wear</option>
                <option value="Ethnic / Haute Couture">Ethnic / Haute Couture</option>
                <option value="Streetwear">Streetwear</option>
                <option value="Accessories & Shoes">Accessories & Shoes</option>
                <option value="Jewellery & Props">Jewellery & Props</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="S, M, L, XL, Free Size"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="e.g. Emerald Green"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="NEW">New with tags</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="NEEDS_CLEANING">Needs Dry Cleaning</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="AVAILABLE">Available in Wardrobe</option>
                <option value="IN_SHOOT">Checked out in Shoot</option>
                <option value="DRY_CLEANING">In Dry Cleaning</option>
                <option value="RETURNED">Returned to Brand</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Shoot Reference</label>
            <input
              type="text"
              value={form.shootReference}
              onChange={(e) => setForm({ ...form, shootReference: e.target.value })}
              placeholder="e.g. Vogue Summer Campaign Day 1"
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
              Save Garment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
