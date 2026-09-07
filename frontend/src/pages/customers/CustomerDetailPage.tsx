import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Plus, IndianRupee, Trash2 } from 'lucide-react';
import { customerApi, interactionApi, paymentApi, projectApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import KPICard from '../../components/ui/KPICard';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Payment recording state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [customerProjects, setCustomerProjects] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    projectId: '',
    paymentMethod: 'UPI',
    paymentType: 'ADVANCE',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });

  const loadCustomer = () => {
    customerApi
      .getOne(id!)
      .then((r) => setCustomer(r.data.data))
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const openPaymentModal = async () => {
    try {
      const res = await projectApi.getAll({ customerId: id, limit: 100 });
      setCustomerProjects(res.data.data || []);
    } catch {
      setCustomerProjects([]);
    }
    setPaymentForm({
      amount: '',
      projectId: '',
      paymentMethod: 'UPI',
      paymentType: (customer?.totalPaid || 0) > 0 ? 'INSTALLMENT' : 'ADVANCE',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm(`Are you sure you want to delete client "${customer.fullName}" and all associated records?`)) return;
    try {
      await customerApi.delete(customer.id);
      toast.success(`Client "${customer.fullName}" deleted`);
      navigate('/customers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount greater than ₹0');
      return;
    }

    setPaymentSubmitting(true);
    try {
      await paymentApi.create({
        customerId: customer.id,
        projectId: paymentForm.projectId || undefined,
        amount: amt,
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes || undefined,
      });

      toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully!`);
      setShowPaymentModal(false);
      loadCustomer();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  if (!customer) return null;

  const tabs = ['overview', 'events', 'contracts', 'payments', 'interactions'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteCustomer}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all"
            title="Delete this client and associated records"
          >
            <Trash2 className="w-4 h-4" /> Delete Client
          </button>
          <button
            onClick={openPaymentModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.fullName}</h2>
            <p className="text-sm text-gray-500 mt-1">{customer.customerCode}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-gray-400" /> {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" /> {customer.email}
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> {customer.city}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF5E8] text-[#93721C] border border-[#ECD9A5]">
              {customer.customerType || 'INDIVIDUAL'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total Events" value={customer._count?.events || 0} icon={<span>📅</span>} color="blue" />
        <KPICard title="Contract Value" value={formatCurrency(customer.totalContractValue || 0)} icon={<span>📄</span>} color="purple" />
        <KPICard title="Total Paid" value={formatCurrency(customer.totalPaid || 0)} icon={<span>💰</span>} color="green" />
        <KPICard title="Remaining Due" value={formatCurrency(customer.remainingAmount || 0)} icon={<span>⏳</span>} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-100 px-4 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-[#C59B27] text-[#93721C] font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'payments' && customer.payments?.length > 0 && (
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  {customer.payments.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Phone', customer.phone],
                ['Alt Phone', customer.alternatePhone],
                ['Email', customer.email],
                ['City', customer.city],
                ['State', customer.state],
                ['Pincode', customer.pincode],
                ['Source', customer.source],
                ['Address', customer.address],
              ].map(([l, v]) => (
                <div key={l as string}>
                  <p className="text-gray-500 text-xs">{l}</p>
                  <p className="font-medium text-gray-900">{(v as string) || '-'}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'events' && (
            <div className="space-y-2">
              {customer.events?.map((e: any) => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/events/${e.id}`)}
                  className="flex justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.eventName}</p>
                    <p className="text-xs text-gray-500">{e.venue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{formatDate(e.startDate)}</p>
                    <StatusBadge status={e.status} />
                  </div>
                </div>
              ))}
              {!customer.events?.length && <p className="text-sm text-gray-400 py-8 text-center">No events</p>}
            </div>
          )}
          {tab === 'contracts' && (
            <div className="space-y-2">
              {customer.contracts?.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  className="flex justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.contractNumber}</p>
                    <p className="text-xs text-gray-500">{c.event?.eventName || c.project?.name || 'Contract'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(c.finalAmount))}</p>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
              {!customer.contracts?.length && <p className="text-sm text-gray-400 py-8 text-center">No contracts</p>}
            </div>
          )}
          {tab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">All logged payments received from this client</p>
                <button
                  onClick={openPaymentModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Payment
                </button>
              </div>
              {customer.payments?.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(Number(p.amount))}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {p.paymentMethod?.replace(/_/g, ' ')} &bull; {p.paymentType?.replace(/_/g, ' ')}
                    </p>
                    {p.transactionId && (
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">Ref: {p.transactionId}</p>
                    )}
                    {p.notes && <p className="text-xs text-gray-500 italic mt-0.5">"{p.notes}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-600">{formatDate(p.paymentDate)}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Received
                    </span>
                  </div>
                </div>
              ))}
              {!customer.payments?.length && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400 mb-3">No payments recorded for this client yet.</p>
                  <button
                    onClick={openPaymentModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" /> Record First Payment
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === 'interactions' && (
            <div className="space-y-2">
              {customer.interactions?.map((i: any) => (
                <div key={i.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between">
                    <StatusBadge status={i.type} />
                    <p className="text-xs text-gray-400">{formatDate(i.interactionDate)}</p>
                  </div>
                  <p className="text-sm font-medium mt-1 text-gray-900">{i.subject || 'No subject'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{i.notes}</p>
                </div>
              ))}
              {!customer.interactions?.length && <p className="text-sm text-gray-400 py-8 text-center">No interactions</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Record Payment for Customer */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Record Payment — ${customer.fullName}`}
        size="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-gray-900">{customer.fullName}</p>
              <p className="text-[11px] text-gray-500">
                Total Contract: {formatCurrency(customer.totalContractValue || 0)} &bull; Paid:{' '}
                {formatCurrency(customer.totalPaid || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Remaining Due</p>
              <p className="text-sm font-bold text-amber-600">
                {formatCurrency(customer.remainingAmount || 0)}
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

          {customerProjects.length > 0 && (
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
                {customerProjects.map((p) => (
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
    </div>
  );
}
