import { useEffect, useState } from 'react';
import {
  Search, Plus, FileText, Printer, Trash2, ExternalLink,
  CheckCircle2, Clock, AlertCircle, IndianRupee, Eye, Building2,
  Calendar, ArrowUpRight
} from 'lucide-react';
import { invoiceApi, contractApi, formatCurrency, formatDate } from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState<'ALL' | 'FASHION' | 'WEDDING'>('ALL');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contractId: '',
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    subtotal: 0,
    discount: 0,
    tax: 0,
    status: 'DRAFT',
  });

  // Invoice Preview / Print Modal
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, conRes] = await Promise.all([
        invoiceApi.getAll({
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          domain: domainFilter !== 'ALL' ? domainFilter : undefined,
        }),
        contractApi.getAll(),
      ]);
      setInvoices(invRes.data?.data || []);
      setContracts(conRes.data?.data || []);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, domainFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleContractSelect = (contractId: string) => {
    const c = contracts.find((item) => item.id === contractId);
    if (!c) {
      setForm((f) => ({ ...f, contractId: '', customerId: '', subtotal: 0 }));
      return;
    }
    const finalAmt = Number(c.finalAmount || c.totalAmount || 0);
    setForm((f) => ({
      ...f,
      contractId,
      customerId: c.customerId,
      subtotal: finalAmt,
      discount: 0,
      tax: Math.round(finalAmt * 0.18), // Default 18% GST estimate
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contractId) {
      toast.error('Please select a contract');
      return;
    }
    setSaving(true);
    try {
      await invoiceApi.create({
        contractId: form.contractId,
        customerId: form.customerId,
        issueDate: form.issueDate,
        dueDate: form.dueDate || null,
        subtotal: Number(form.subtotal),
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        status: form.status,
      });
      toast.success('Invoice created successfully');
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await invoiceApi.updateStatus(id, newStatus);
      toast.success('Invoice status updated');
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceApi.delete(id);
      toast.success('Invoice deleted');
      loadData();
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  // Metrics
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const paidInvoiced = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const pendingInvoiced = invoices
    .filter((i) => i.status === 'DRAFT' || i.status === 'SENT')
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const overdueInvoiced = invoices
    .filter((i) => i.status === 'OVERDUE')
    .reduce((s, i) => s + Number(i.total || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Studio Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate, track, and manage client tax invoices and billing receipts
          </p>
        </div>
        <button
          onClick={() => {
            if (contracts.length > 0) {
              handleContractSelect(contracts[0].id);
            }
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Invoiced</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalInvoiced)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{invoices.length} invoices generated</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Paid / Cleared</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(paidInvoiced)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {invoices.filter((i) => i.status === 'PAID').length} invoices settled
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Payment</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(pendingInvoiced)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Draft or Sent to client</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Overdue</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(overdueInvoiced)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Past payment due date</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain selector */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-xs">
            {(['ALL', 'FASHION', 'WEDDING'] as const).map((dom) => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  domainFilter === dom
                    ? 'bg-[#C59B27] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {dom === 'ALL' ? 'All' : dom === 'FASHION' ? 'Fashion' : 'Wedding'}
              </button>
            ))}
          </div>

          {/* Status selector */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-xs overflow-x-auto">
            {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search invoice #, client, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#C59B27]"
          />
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client / Brand</th>
                  <th className="py-3 px-4">Project / Contract</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: any) => {
                  const clientName = inv.customer?.companyName || inv.customer?.fullName || 'Client';
                  const projName =
                    inv.contract?.project?.name ||
                    inv.contract?.event?.eventName ||
                    inv.contract?.contractNumber ||
                    '-';

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#C59B27]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-gray-900 block">{clientName}</span>
                        {inv.customer?.email && (
                          <span className="text-gray-400 text-[11px]">{inv.customer.email}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700">
                        <span className="font-medium text-gray-900 block">{projName}</span>
                        {inv.contract?.contractNumber && (
                          <span className="text-gray-400 text-[10px]">
                            Contract: {inv.contract.contractNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {inv.dueDate ? formatDate(inv.dueDate) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-gray-900 text-right">
                        {formatCurrency(Number(inv.total))}
                        <div className="text-[10px] text-gray-400 font-normal">
                          Sub: {formatCurrency(Number(inv.subtotal))} | Tax: {formatCurrency(Number(inv.tax))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                          className={`text-xs font-bold border rounded-lg px-2.5 py-1 outline-none ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'SENT'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : inv.status === 'OVERDUE'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : inv.status === 'CANCELLED'
                              ? 'bg-gray-100 text-gray-500 border-gray-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="SENT">SENT</option>
                          <option value="PAID">PAID</option>
                          <option value="OVERDUE">OVERDUE</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview / Print Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No invoices found</p>
            <p className="text-xs text-gray-400 mt-1">
              Create an invoice linked to a contract or project shoot.
            </p>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Invoice">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Contract / Shoot *
            </label>
            <select
              value={form.contractId}
              onChange={(e) => handleContractSelect(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
            >
              <option value="">-- Choose Contract --</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} — {c.customer?.fullName || c.customer?.companyName} ({c.project?.name || c.event?.eventName || 'Contract'}) [{formatCurrency(Number(c.finalAmount || 0))}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subtotal (₹) *</label>
              <input
                type="number"
                min={0}
                required
                value={form.subtotal}
                onChange={(e) => setForm({ ...form, subtotal: +e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Discount (₹)</label>
              <input
                type="number"
                min={0}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: +e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax / GST (₹)</label>
              <input
                type="number"
                min={0}
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: +e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          {/* Calculation Banner */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700">Calculated Net Total:</span>
            <span className="text-base font-bold text-[#C59B27]">
              {formatCurrency(Number(form.subtotal) - Number(form.discount || 0) + Number(form.tax || 0))}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
            >
              <option value="DRAFT">DRAFT (Draft copy)</option>
              <option value="SENT">SENT (Dispatched to client)</option>
              <option value="PAID">PAID (Payment collected)</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all disabled:opacity-60"
            >
              Save Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Invoice Preview Modal */}
      {previewInvoice && (
        <Modal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          title={`Invoice Preview — ${previewInvoice.invoiceNumber}`}
        >
          <div className="space-y-6">
            {/* Printable Content Container */}
            <div id="printable-invoice" className="p-6 bg-white border border-gray-200 rounded-2xl space-y-6 text-xs text-gray-700">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">MERAKI STUDIO</h2>
                  <p className="text-[11px] text-gray-500">Commercial Fashion &amp; Luxury Wedding Photography</p>
                  <p className="text-[10px] text-gray-400 mt-1">GSTIN: 27AABCM8921Z1ZP</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#C59B27] block">{previewInvoice.invoiceNumber}</span>
                  <p className="text-xs text-gray-500 mt-0.5">Status: <strong className="uppercase">{previewInvoice.status}</strong></p>
                  <p className="text-xs text-gray-500">Date: {formatDate(previewInvoice.issueDate)}</p>
                  {previewInvoice.dueDate && <p className="text-xs text-gray-500">Due: {formatDate(previewInvoice.dueDate)}</p>}
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Billed To</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {previewInvoice.customer?.companyName || previewInvoice.customer?.fullName}
                  </p>
                  {previewInvoice.customer?.companyName && previewInvoice.customer?.fullName && (
                    <p className="text-gray-600">{previewInvoice.customer.fullName}</p>
                  )}
                  {previewInvoice.customer?.phone && <p className="text-gray-500">{previewInvoice.customer.phone}</p>}
                  {previewInvoice.customer?.email && <p className="text-gray-500">{previewInvoice.customer.email}</p>}
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project / Contract</p>
                  <p className="font-bold text-gray-900">
                    {previewInvoice.contract?.project?.name || previewInvoice.contract?.event?.eventName || 'Contract Service'}
                  </p>
                  <p className="text-gray-500 mt-0.5">Contract Ref: {previewInvoice.contract?.contractNumber || 'Direct'}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full border-t border-b border-gray-200 my-4 text-left">
                <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <tr className="border-b border-gray-100">
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-3 font-semibold text-gray-800">
                      Photography &amp; Creative Production Services
                      <div className="text-[11px] text-gray-400 font-normal">
                        Full shoot production, editing, retouching, and master deliverables
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(Number(previewInvoice.subtotal))}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(Number(previewInvoice.subtotal))}</span>
                  </div>
                  {Number(previewInvoice.discount) > 0 && (
                    <div className="flex justify-between py-1 text-emerald-600 border-b border-gray-50">
                      <span>Discount</span>
                      <span>- {formatCurrency(Number(previewInvoice.discount))}</span>
                    </div>
                  )}
                  {Number(previewInvoice.tax) > 0 && (
                    <div className="flex justify-between py-1 text-gray-500 border-b border-gray-50">
                      <span>GST (18%)</span>
                      <span className="font-semibold">{formatCurrency(Number(previewInvoice.tax))}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-gray-900 text-sm font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-[#C59B27]">{formatCurrency(Number(previewInvoice.total))}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details Footer */}
              <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 flex justify-between items-end">
                <div>
                  <p className="font-bold text-gray-700">Bank Transfer Details:</p>
                  <p>Bank: HDFC Bank | A/C: 50200012345678</p>
                  <p>IFSC: HDFC0001234 | UPI: meraki@hdfcbank</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">For Meraki Studio</p>
                  <p className="text-[10px] mt-4 text-gray-400">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-900 text-white hover:bg-black rounded-xl shadow-xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
