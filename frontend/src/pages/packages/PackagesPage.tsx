import { useEffect, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { packageApi } from '../../services/api';
import { formatCurrency } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', basePrice: 0, duration: '', description: '' });

  const load = async () => { try { const { data } = await packageApi.getAll(); setPackages(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await packageApi.create(form); toast.success('Package created!'); setShowModal(false); load(); } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Packages</h2><p className="text-sm text-gray-500">Studio service packages</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Add Package</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Package className="w-6 h-6" /></div>
              <div><p className="font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.duration}</p></div>
            </div>
            <p className="text-3xl font-bold text-indigo-600 mb-4">{formatCurrency(Number(p.basePrice))}</p>
            <div className="space-y-2 mb-4">
              {p.services?.map((s: any) => <div key={s.id} className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />{s.serviceName}</div>)}
            </div>
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">{p._count?.contracts || 0} contracts use this package</div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Package" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹) *</label><input type="number" required value={form.basePrice} onChange={(e) => setForm({...form, basePrice: +e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label><input value={form.duration} onChange={(e) => setForm({...form, duration: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Package</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
