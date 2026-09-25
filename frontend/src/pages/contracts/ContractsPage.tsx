import { useEffect, useState } from 'react';
import { Plus, Search, FileText, Edit2, Trash2, CheckCircle2, Clock, Heart, Shirt, IndianRupee, CreditCard } from 'lucide-react';
import { contractApi, customerApi, projectApi, packageApi, paymentApi, formatCurrency, formatDate } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

interface ContractItem {
  serviceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export default function ContractsPage({ domainFilter }: { domainFilter?: 'WEDDING' | 'FASHION' }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WEDDING' | 'FASHION'>(domainFilter || 'ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    paymentType: 'ADVANCE',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });

  // Form Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  // Contract Form State
  const [form, setForm] = useState({
    customerId: '',
    projectId: '',
    packageId: '',
    contractDate: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    termsAndConditions: '',
    items: [] as ContractItem[],
  });

  // Add Item inline state
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  const loadData = async () => {
    setLoading(true);
    const resolvedDomain = domainFilter ? domainFilter : activeTab !== 'ALL' ? activeTab : undefined;
    try {
      const { data } = await contractApi.getAll({
        domain: resolvedDomain,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      });
      setContracts(data.data || []);
    } catch {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, activeTab, domainFilter]);

  const loadFormData = async () => {
    try {
      const resolvedDomain = domainFilter ? domainFilter : activeTab !== 'ALL' ? activeTab : undefined;
      const [cRes, pRes, pkgRes] = await Promise.all([
        customerApi.getAll({ clientType: resolvedDomain }),
        projectApi.getAll({ type: resolvedDomain }),
        packageApi.getAll({ domain: resolvedDomain }),
      ]);
      setCustomers(cRes.data.data || []);
      setProjects(pRes.data.data || []);
      setPackages(pkgRes.data.data || []);
    } catch {
      toast.error('Failed to load form data');
    }
  };

  const openCreateModal = async () => {
    setEditingContract(null);
    setForm({
      customerId: '',
      projectId: '',
      packageId: '',
      contractDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      termsAndConditions: '',
      items: [],
    });
    setNewItemName('');
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
    await loadFormData();
    setShowModal(true);
  };

  const openEditModal = async (c: any) => {
    setEditingContract(c);
    setForm({
      customerId: c.customerId || '',
      projectId: c.projectId || '',
      packageId: c.packageId || '',
      contractDate: c.contractDate ? c.contractDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: c.status || 'DRAFT',
      termsAndConditions: c.termsAndConditions || '',
      items: (c.items || []).map((item: any) => ({
        serviceName: item.serviceName,
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      })),
    });
    setNewItemName('');
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
    await loadFormData();
    setShowModal(true);
  };

  const handleLoadFromPackage = () => {
    const pkg = packages.find((p) => p.id === form.packageId);
    if (!pkg) return;
    const newItems: ContractItem[] = (pkg.services || []).map((s: any) => ({
      serviceName: s.serviceName,
      description: s.description || '',
      quantity: Number(s.quantity) || 1,
      unitPrice: Number(pkg.basePrice) / (pkg.services?.length || 1),
    }));
    setForm({
      ...form,
      items: newItems.length > 0 ? newItems : [{
        serviceName: pkg.name,
        description: pkg.description || 'Package service',
        quantity: 1,
        unitPrice: Number(pkg.basePrice) || 0,
      }],
    });
    toast.success(`Loaded services from "${pkg.name}" package`);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          serviceName: newItemName.trim(),
          description: newItemDesc.trim() || undefined,
          quantity: Number(newItemQty) || 1,
          unitPrice: Number(newItemPrice) || 0,
        },
      ],
    });
    setNewItemName('');
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  // Calculate subtotal from items
  const calcSubtotal = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) {
      toast.error('Please select a client');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Please add at least one service item');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: form.customerId,
        projectId: form.projectId || null,
        packageId: form.packageId || null,
        eventId: null,
        contractDate: form.contractDate,
        subtotal: calcSubtotal,
        discount: 0,
        tax: 0,
        status: form.status,
        termsAndConditions: form.termsAndConditions || null,
        items: form.items.map((item) => ({
          serviceName: item.serviceName,
          description: item.description || null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        })),
      };

      if (editingContract) {
        await contractApi.update(editingContract.id, payload);
        toast.success('Contract updated successfully');
      } else {
        await contractApi.create(payload);
        toast.success('Contract created successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete contract "${number}"? This will unlink all payments and deliverables.`)) return;
    try {
      await contractApi.delete(id);
      toast.success('Contract deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete contract');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await contractApi.updateStatus(id, status);
      toast.success(`Contract status updated to ${status}`);
      loadData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openPaymentModal = (c: any) => {
    setSelectedContract(c);
    setPaymentForm({
      amount: '',
      paymentMethod: 'UPI',
      paymentType: (c.totalPaid || 0) > 0 ? 'INSTALLMENT' : 'ADVANCE',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    setPaymentSubmitting(true);
    try {
      await paymentApi.create({
        customerId: selectedContract.customer?.id || selectedContract.customerId,
        contractId: selectedContract.id,
        projectId: selectedContract.projectId || undefined,
        domain: domainFilter || 'WEDDING',
        amount: amt,
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} recorded`);
      setShowPaymentModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Financial KPIs
  const totalValue = contracts.reduce((sum, c) => sum + Number(c.finalAmount || 0), 0);
  const totalPaid = contracts.reduce((sum, c) => sum + Number(c.totalPaid || 0), 0);
  const totalRemaining = contracts.reduce((sum, c) => sum + Number(c.remainingAmount || 0), 0);

  const pageTitle = domainFilter === 'WEDDING'
    ? 'Wedding Shoot Contracts'
    : domainFilter === 'FASHION'
    ? 'Studio Fashion Contracts'
    : 'All Contracts';

  const pageSub = domainFilter === 'WEDDING'
    ? 'Service agreements, pricing breakdown, and payment tracking for wedding shoots'
    : domainFilter === 'FASHION'
    ? 'Commercial agreements for fashion projects and lookbook shoots'
    : 'Unified view of all studio contracts across wedding and fashion domains';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pageSub}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-sm font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Total Contracts</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{contracts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Total Value</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Amount Received</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Remaining Dues</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        {/* Domain Filter (if not locked) */}
        {!domainFilter && (
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
            <span className="text-xs font-semibold text-gray-400 uppercase mr-2">Domain:</span>
            {[
              { id: 'ALL', label: 'All Contracts' },
              { id: 'WEDDING', label: 'Wedding Shoot' },
              { id: 'FASHION', label: 'Studio Fashion' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/40 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Status Filter & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27]"
            />
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : contracts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Contract</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contracts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{c.contractNumber}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {formatDate(c.contractDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800">{c.customer?.fullName || '-'}</div>
                      {c.customer?.phone && (
                        <div className="text-[11px] text-gray-400">{c.customer.phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {c.project?.name || c.event?.eventName || '-'}
                      {c.project?.projectType && (
                        <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                          c.project.projectType === 'WEDDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                        }`}>
                          {c.project.projectType === 'WEDDING' ? '💍' : '👗'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {c.package?.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(c.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(c.totalPaid || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                      {formatCurrency(c.remainingAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`text-xs font-semibold border rounded-lg px-2.5 py-1 outline-none cursor-pointer ${
                          c.status === 'ACTIVE' || c.status === 'SIGNED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : c.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : c.status === 'SENT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="SIGNED">SIGNED</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openPaymentModal(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all shadow-xs"
                          title="Record payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          + Pay
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.contractNumber)}
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
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No contracts found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search ? 'No contracts match your search query.' : 'Create a new contract to get started with client agreements.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Create Contract
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Contract Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingContract ? `Edit Contract: ${editingContract.contractNumber}` : 'Create New Contract'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client & Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Client *</label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white"
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Linked Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white"
              >
                <option value="">-- No Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Package & Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Package Template</label>
              <div className="flex gap-2">
                <select
                  value={form.packageId}
                  onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white"
                >
                  <option value="">-- No Package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({formatCurrency(pkg.basePrice)})
                    </option>
                  ))}
                </select>
                {form.packageId && (
                  <button
                    type="button"
                    onClick={handleLoadFromPackage}
                    className="px-2.5 py-1.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-all whitespace-nowrap"
                  >
                    Load Services
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contract Date *</label>
              <input
                required
                type="date"
                value={form.contractDate}
                onChange={(e) => setForm({ ...form, contractDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="SIGNED">Signed</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Service Line Items ({form.items.length})
              </label>
              <div className="text-xs font-bold text-gray-900">
                Subtotal: <span className="text-[#9A7318]">{formatCurrency(calcSubtotal)}</span>
              </div>
            </div>

            {/* Current items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-900">{item.serviceName}</span>
                      {item.description && (
                        <span className="text-gray-400 text-[11px] ml-1.5">• {item.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-gray-500">×{item.quantity}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(item.unitPrice)}</span>
                    <span className="text-[10px] text-gray-400">= {formatCurrency((item.quantity || 1) * (item.unitPrice || 0))}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item inline */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 border-t border-gray-200">
              <input
                type="text"
                placeholder="Service name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
              <input
                type="text"
                placeholder="Description"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Unit Price (₹)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-bold"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-all"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              rows={2}
              value={form.termsAndConditions}
              onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
              placeholder="Payment terms, cancellation policy, deliverable timelines..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-sm font-bold text-gray-900">
              Contract Total: <span className="text-[#9A7318] text-base">{formatCurrency(calcSubtotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingContract ? 'Save Changes' : 'Create Contract'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      {selectedContract && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Record Payment — ${selectedContract.contractNumber}`}
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900">{selectedContract.contractNumber}</p>
                <p className="text-[11px] text-gray-500">
                  Client: {selectedContract.customer?.fullName || 'Client'} &bull; Total: {formatCurrency(selectedContract.finalAmount || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Remaining Due</p>
                <p className="text-sm font-bold text-amber-600">
                  {formatCurrency(selectedContract.remainingAmount ?? (selectedContract.finalAmount || 0))}
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
                  placeholder="Enter amount received"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>
            </div>

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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Ref #</label>
                <input
                  type="text"
                  placeholder="UPI Ref / Cheque No"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Advance for wedding shoot contract"
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
