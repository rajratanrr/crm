import { useEffect, useState } from 'react';
import { Plus, Search, IndianRupee, TrendingUp, Clock } from 'lucide-react';
import { paymentApi, contractApi, customerApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import KPICard from '../../components/ui/KPICard';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [form, setForm] = useState({ contractId: '', customerId: '', amount: 0, paymentMethod: 'UPI', paymentType: 'INSTALLMENT', paymentDate: new Date().toISOString().split('T')[0], transactionId: '' });

  const load = async () => {
    try {
      const [p, s] = await Promise.all([paymentApi.getAll({ search }), paymentApi.getStats()]);
      setPayments(p.data.data); setStats(s.data.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  useEffect(() => { if (showModal) contractApi.getAll({ limit: '200' }).then(r => setContracts(r.data.data)).catch(()=>{}); }, [showModal]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const contract = contracts.find(c => c.id === form.contractId);
    try { await paymentApi.create({ ...form, customerId: contract?.customer?.id || contract?.customerId }); toast.success('Payment recorded!'); setShowModal(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Payments</h2><p className="text-sm text-gray-500">Track all payment transactions</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"><Plus className="w-4 h-4" /> Record Payment</button>
      </div>

      {stats && <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Today's Collection" value={formatCurrency(stats.todayCollection)} icon={<IndianRupee className="w-5 h-5" />} color="green" />
        <KPICard title="Monthly Collection" value={formatCurrency(stats.monthCollection)} icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <KPICard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<IndianRupee className="w-5 h-5" />} color="indigo" />
        <KPICard title="Pending Payments" value={formatCurrency(stats.pendingPayments)} icon={<Clock className="w-5 h-5" />} color="orange" />
      </div>}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100"><div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm"><Search className="w-4 h-4 text-gray-400 mr-2" /><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" /></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
          {['Customer', 'Contract', 'Amount', 'Method', 'Type', 'Date', 'Transaction ID'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
        </tr></thead><tbody>
          {payments.map((p: any) => (
            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{p.customer?.fullName}</td>
              <td className="px-4 py-3 text-sm text-indigo-600">{p.contract?.contractNumber}</td>
              <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(Number(p.amount))}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.paymentMethod}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.paymentType?.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.paymentDate)}</td>
              <td className="px-4 py-3 text-sm text-gray-400">{p.transactionId || '-'}</td>
            </tr>))}
        </tbody></table></div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
              <select required value={form.contractId} onChange={(e) => setForm({...form, contractId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select contract</option>
                {contracts.map(c => <option key={c.id} value={c.id}>{c.contractNumber} - {c.customer?.fullName}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input type="number" required min={1} value={form.amount} onChange={(e) => setForm({...form, amount: +e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['CASH','UPI','BANK_TRANSFER','CARD','CHEQUE'].map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.paymentType} onChange={(e) => setForm({...form, paymentType: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['ADVANCE','INSTALLMENT','FINAL_PAYMENT','ADDITIONAL_SERVICE'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" required value={form.paymentDate} onChange={(e) => setForm({...form, paymentDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input value={form.transactionId} onChange={(e) => setForm({...form, transactionId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
