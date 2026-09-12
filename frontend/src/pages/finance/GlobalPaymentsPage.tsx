import { useEffect, useState } from 'react';
import { Plus, Search, IndianRupee, Clock, TrendingUp, Heart, Shirt, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { paymentApi, projectApi, contractApi, customerApi, formatCurrency, formatDate } from '../../services/api';
import KPICard from '../../components/ui/KPICard';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function GlobalPaymentsPage({ domainFilter }: { domainFilter?: 'WEDDING' | 'FASHION' }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WEDDING' | 'FASHION'>(domainFilter || 'ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  // Form Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  const [form, setForm] = useState({
    customerId: '',
    projectId: '',
    contractId: '',
    domain: domainFilter || 'WEDDING',
    amount: '',
    paymentMethod: 'UPI',
    paymentStatus: 'ADVANCE',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const resolvedDomain = domainFilter ? domainFilter : activeTab !== 'ALL' ? activeTab : undefined;
    try {
      const [pRes, sRes] = await Promise.all([
        paymentApi.getAll({
          domain: resolvedDomain,
          search: search || undefined,
        }),
        paymentApi.getFinanceSummary({ domain: resolvedDomain }),
      ]);
      setPayments(pRes.data.data);
      setSummary(sRes.data.data);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, activeTab, domainFilter]);

  const openCreateModal = async () => {
    setEditingPayment(null);
    setForm({
      customerId: '',
      projectId: '',
      contractId: '',
      domain: domainFilter || (activeTab === 'FASHION' ? 'FASHION' : 'WEDDING'),
      amount: '',
      paymentMethod: 'UPI',
      paymentStatus: 'ADVANCE',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: '',
    });

    try {
      const [cRes, prjRes, conRes] = await Promise.all([
        customerApi.getAll(),
        projectApi.getAll({ type: domainFilter || undefined }),
        contractApi.getAll(),
      ]);
      setCustomers(cRes.data.data);
      setProjects(prjRes.data.data);
      setContracts(conRes.data.data);
      if (cRes.data.data.length > 0) {
        setForm((f) => ({ ...f, customerId: cRes.data.data[0].id }));
      }
    } catch {}

    setIsModalOpen(true);
  };

  const openEditModal = async (payment: any) => {
    setEditingPayment(payment);
    setForm({
      customerId: payment.customerId,
      projectId: payment.projectId || '',
      contractId: payment.contractId || '',
      domain: payment.domain,
      amount: String(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus || 'ADVANCE',
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
      transactionId: payment.transactionId || '',
      notes: payment.notes || '',
    });

    try {
      const [cRes, prjRes, conRes] = await Promise.all([
        customerApi.getAll(),
        projectApi.getAll(),
        contractApi.getAll(),
      ]);
      setCustomers(cRes.data.data);
      setProjects(prjRes.data.data);
      setContracts(conRes.data.data);
    } catch {}

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.amount) {
      toast.error('Client and Amount are required');
      return;
    }

    try {
      if (editingPayment) {
        await paymentApi.update(editingPayment.id, {
          ...form,
          amount: Number(form.amount),
          projectId: form.projectId || null,
          contractId: form.contractId || null,
        });
        toast.success('Payment updated successfully');
      } else {
        await paymentApi.create({
          ...form,
          amount: Number(form.amount),
          projectId: form.projectId || null,
          contractId: form.contractId || null,
        });
        toast.success('Payment recorded successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await paymentApi.delete(id);
      toast.success('Payment record deleted');
      loadData();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const pageTitle = domainFilter === 'WEDDING'
    ? 'Wedding Payments'
    : domainFilter === 'FASHION'
    ? 'Studio Fashion Payments'
    : 'Finance & Payments Overview';

  const pageDesc = domainFilter === 'WEDDING'
    ? 'Advance deposits, milestone installments, and balances for Wedding Shoot contracts & projects'
    : domainFilter === 'FASHION'
    ? 'Payments, retainers, and billing for Fashion lookbooks, campaigns, and studio bookings'
    : 'Consolidated payment records and financial telemetry across Wedding Shoot and Studio Fashion';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pageDesc}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Financial Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrency(summary?.totalReceived || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Cleared client collections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {formatCurrency(summary?.totalPending || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Outstanding receivables</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Volume / Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(summary?.totalRevenue || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total contract / project value</p>
        </div>
      </div>

      {/* Global Domain Filter Tabs (only on /finance/payments) */}
      {!domainFilter && (
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-xs w-fit">
          {[
            { id: 'ALL', label: 'All Payments' },
            { id: 'WEDDING', label: 'Wedding Shoot Payments' },
            { id: 'FASHION', label: 'Studio Fashion Payments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/40'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Payments Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm w-full focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by client, project, transaction ID..."
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
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Reference Project / Contract</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {p.customer?.fullName || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 ${
                          p.domain === 'FASHION'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.domain === 'FASHION' ? (
                          <>
                            <Shirt className="w-3 h-3 text-purple-600" /> Fashion
                          </>
                        ) : (
                          <>
                            <Heart className="w-3 h-3 text-amber-600" /> Wedding
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">
                      {p.project?.name ? (
                        <span className="font-medium text-gray-900">{p.project.name}</span>
                      ) : p.contract?.contractNumber ? (
                        <span className="font-mono text-gray-600">{p.contract.contractNumber}</span>
                      ) : (
                        <span className="text-gray-400">Direct Client Payment</span>
                      )}
                      {p.transactionId && (
                        <div className="text-[10px] text-gray-400 font-mono">Ref: {p.transactionId}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">
                      {p.paymentMethod?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {(() => {
                        const st = p.paymentStatus || 'ADVANCE';
                        const styles: Record<string, string> = {
                          ADVANCE: 'bg-blue-50 text-blue-700 border border-blue-200',
                          PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
                          DONE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                        };
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${styles[st] || styles.ADVANCE}`}>
                            {st}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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
            <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No payments found</p>
            <p className="text-xs text-gray-400 mt-1">Record your first client payment to populate financial records.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Record Payment
            </button>
          </div>
        )}
      </div>

      {/* Record / Edit Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? 'Edit Payment Record' : 'Record Payment'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Domain *</label>
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="WEDDING">Wedding Shoot</option>
                <option value="FASHION">Studio Fashion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">-- Select Client --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone || c.clientType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Associated Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">-- Direct Payment / No Project --</option>
                {projects
                  .filter((p) => p.projectType === form.domain)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.budget)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="50000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS/RTGS)</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status *</label>
              <select
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="ADVANCE">Advance / Deposit Received</option>
                <option value="PENDING">Pending (not yet received)</option>
                <option value="DONE">Done — Final Settlement Cleared</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Only <strong>Advance</strong> and <strong>Done</strong> count toward received revenue.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transaction ID / UTR</label>
              <input
                type="text"
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                placeholder="e.g. UPI-2026090712345"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Advance paid via GPay, confirmed receipt sent"
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
              {editingPayment ? 'Save Changes' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
