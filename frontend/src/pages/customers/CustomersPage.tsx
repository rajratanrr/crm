import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Heart, Shirt, CreditCard, IndianRupee, Calendar, CheckCircle2 } from 'lucide-react';
import { customerApi, paymentApi, projectApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function CustomersPage({ domainFilter }: { domainFilter?: 'WEDDING' | 'FASHION' }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WEDDING' | 'FASHION'>(domainFilter || 'ALL');
  const [showModal, setShowModal] = useState(false);

  // Client creation form state
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    source: 'Instagram',
    address: '',
    clientType: domainFilter || 'WEDDING',
    companyName: '',
    notes: '',
  });

  // Payment recording modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    projectId: '',
    paymentMethod: 'UPI',
    paymentType: 'ADVANCE',
    paymentDate: new Date().toISOString().slice(0, 10),
    transactionId: '',
    notes: '',
  });

  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await customerApi.getAll({
        search,
        clientType: domainFilter ? domainFilter : activeTab !== 'ALL' ? activeTab : undefined,
      });
      setCustomers(data.data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, activeTab, domainFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      toast.error('Please enter name and phone number');
      return;
    }
    try {
      await customerApi.create({
        ...form,
        clientType: domainFilter || form.clientType,
      });
      toast.success('Client created successfully');
      setShowModal(false);
      setForm({
        fullName: '',
        phone: '',
        email: '',
        city: '',
        source: 'Instagram',
        address: '',
        clientType: domainFilter || 'WEDDING',
        companyName: '',
        notes: '',
      });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    }
  };

  // Open Payment Modal for a specific client
  const openPaymentModal = async (c: any) => {
    setSelectedClient(c);
    setPaymentForm({
      amount: c.remainingAmount > 0 ? String(c.remainingAmount) : '',
      projectId: '',
      paymentMethod: 'UPI',
      paymentType: c.totalPaid > 0 ? 'INSTALLMENT' : 'ADVANCE',
      paymentDate: new Date().toISOString().slice(0, 10),
      transactionId: '',
      notes: '',
    });

    try {
      const res = await projectApi.getAll({ customerId: c.id });
      const projs = res.data.data || [];
      setClientProjects(projs);
      if (projs.length === 1) {
        setPaymentForm((f) => ({ ...f, projectId: projs[0].id }));
      }
    } catch {
      setClientProjects([]);
    }

    setShowPaymentModal(true);
  };

  // Submit payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setPaymentSubmitting(true);
    try {
      await paymentApi.create({
        customerId: selectedClient.id,
        projectId: paymentForm.projectId || undefined,
        amount: amt,
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        domain: selectedClient.clientType || 'WEDDING',
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes || undefined,
      });

      toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} recorded for ${selectedClient.fullName}!`);
      setShowPaymentModal(false);
      load(); // Refreshes table so Paid & Remaining columns update immediately
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const domainTitle =
    domainFilter === 'WEDDING'
      ? 'Wedding Clients'
      : domainFilter === 'FASHION'
      ? 'Fashion Clients & Brands'
      : 'All Clients';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{domainTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {domainFilter === 'WEDDING'
              ? 'Couples, families, and wedding organizers'
              : domainFilter === 'FASHION'
              ? 'Fashion designers, apparel brands, agencies & commercial clients'
              : 'Complete client roster across Wedding & Fashion operations'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm shadow-[#C59B27]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {!domainFilter && (
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white text-gray-900 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Domains
              </button>
              <button
                onClick={() => setActiveTab('WEDDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'WEDDING'
                    ? 'bg-white text-amber-800 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-amber-800'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-amber-600" /> Wedding
              </button>
              <button
                onClick={() => setActiveTab('FASHION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'FASHION'
                    ? 'bg-white text-purple-800 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-purple-800'
                }`}
              >
                <Shirt className="w-3.5 h-3.5 text-purple-600" /> Fashion
              </button>
            </div>
          )}

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, brand, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-[#C59B27] bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No clients found"
            description="Add your first client to begin tracking projects, contracts & payments"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Projects</th>
                  <th className="py-3.5 px-4 text-right">Contract Value</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Remaining</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#C59B27] transition-colors">
                          {c.fullName}
                        </p>
                        {c.companyName && (
                          <p className="text-[11px] font-medium text-purple-700 mt-0.5">
                            {c.companyName}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {c.customerCode}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                          c.clientType === 'FASHION'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.clientType === 'FASHION' ? (
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
                    <td className="py-3.5 px-4 text-gray-600 text-xs">{c.phone}</td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">{c.city || '-'}</td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      {(c._count?.projects || 0) + (c._count?.events || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(c.totalContractValue || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(c.totalPaid || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                      {formatCurrency(c.remainingAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openPaymentModal(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm transition-all"
                        title="Record payment received from this client"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        + Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Client */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={domainFilter === 'FASHION' ? 'Add Fashion Client / Brand' : 'Add Client'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {!domainFilter && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Domain</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clientType: 'WEDDING' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    form.clientType === 'WEDDING'
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Heart className="w-4 h-4 text-amber-600" /> Wedding Client
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clientType: 'FASHION' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    form.clientType === 'FASHION'
                      ? 'border-purple-400 bg-purple-50 text-purple-800'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Shirt className="w-4 h-4 text-purple-600" /> Fashion Brand
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {form.clientType === 'FASHION' ? 'Contact Person Name *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Aryan Malhotra"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            {form.clientType === 'FASHION' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand / Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Vogue India / Sabyasachi"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai / Chandigarh"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white"
              >
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral / Word of Mouth</option>
                <option value="Website">Website</option>
                <option value="Google">Google Search</option>
                <option value="Fashion Agency">Fashion Agency</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Client preferences, requirements..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all"
            >
              Save Client
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment for Client */}
      {selectedClient && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Record Payment — ${selectedClient.fullName}`}
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {/* Client summary badge */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900">{selectedClient.fullName}</p>
                <p className="text-[11px] text-gray-500">
                  Total Contract: {formatCurrency(selectedClient.totalContractValue || 0)} &bull; Paid: {formatCurrency(selectedClient.totalPaid || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Remaining Due</p>
                <p className="text-sm font-bold text-amber-600">
                  {formatCurrency(selectedClient.remainingAmount || 0)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Amount (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Enter amount paid"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>
            </div>

            {clientProjects.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Link to Project (Optional)
                </label>
                <select
                  value={paymentForm.projectId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27] bg-white"
                >
                  <option value="">General Client Payment (No project linked)</option>
                  {clientProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectNumber}) — Budget: ₹{Number(p.budget).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27] bg-white font-medium"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Stage</label>
                <select
                  value={paymentForm.paymentType}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27] bg-white font-medium"
                >
                  <option value="ADVANCE">Booking Advance</option>
                  <option value="INSTALLMENT">Stage / Installment</option>
                  <option value="FINAL_PAYMENT">Final Settlement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date *</label>
                <input
                  required
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction / Ref # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cheque No"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Remarks</label>
              <input
                type="text"
                placeholder="e.g. 50% advance token paid via GPay"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentSubmitting}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {paymentSubmitting ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
