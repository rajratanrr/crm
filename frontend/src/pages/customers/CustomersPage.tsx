import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { customerApi } from '../../services/api';
import { formatCurrency } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', city: '', source: '', address: '', notes: '' });
  const navigate = useNavigate();

  const load = async () => {
    try { const { data } = await customerApi.getAll({ search }); setCustomers(data.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await customerApi.create(form); toast.success('Customer created!'); setShowModal(false); setForm({ fullName: '', phone: '', email: '', city: '', source: '', address: '', notes: '' }); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Customers</h2><p className="text-sm text-gray-500">Manage all studio customers</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> Add Customer</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm focus-within:border-indigo-400 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" placeholder="Search by name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" />
          </div>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div> :
        customers.length === 0 ? <EmptyState title="No customers yet" description="Add your first customer to get started" /> :
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Customer', 'Phone', 'City', 'Events', 'Contract Value', 'Paid', 'Remaining'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{c.fullName}</p><p className="text-xs text-gray-400">{c.customerCode}</p></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.city || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c._count?.events || 0}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(c.totalContractValue || 0)}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(c.totalPaid || 0)}</td>
                  <td className="px-4 py-3 text-sm text-orange-600 font-medium">{formatCurrency(c.remainingAmount || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Customer" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="text" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select source</option>
                {['Instagram','Facebook','Google','Referral','JustDial','Wedding Wire','Walk-in'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
