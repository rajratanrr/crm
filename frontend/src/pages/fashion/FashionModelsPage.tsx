import { useEffect, useState } from 'react';
import {
  Plus, Search, UserCircle, Trash2, Edit2, X, Mail, Phone, AtSign,
  Ruler, Building2, History, IndianRupee, Calendar, ChevronRight, Loader2,
  CreditCard, Wallet, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { modelApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-Binary', 'Other'];
const PAYMENT_METHODS = ['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'];

function defaultForm() {
  return {
    name: '', agency: '', phone: '', email: '',
    instagram: '', gender: 'Female', height: '', measurements: '', notes: '',
  };
}

function defaultPaymentForm() {
  return {
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    reference: '',
    notes: '',
  };
}

export default function FashionModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [form, setForm] = useState(defaultForm());
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [modelDetail, setModelDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState(defaultPaymentForm());
  const [paySaving, setPaySaving] = useState(false);

  // Detail tab
  const [detailTab, setDetailTab] = useState<'shoots' | 'payments'>('shoots');

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

  useEffect(() => { load(); }, [search]);

  const loadDetail = async (model: any) => {
    setSelectedModel(model);
    setDetailLoading(true);
    try {
      const { data } = await modelApi.getOne(model.id);
      setModelDetail(data.data);
    } catch {
      toast.error('Failed to load model details');
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingModel(null);
    setForm(defaultForm());
    setIsModalOpen(true);
  };

  const openEditModal = (m: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingModel(m);
    setForm({
      name: m.name || '',
      agency: m.agency || '',
      phone: (m.phone || '').replace(/\D/g, '').slice(0, 10),
      email: m.email || '',
      instagram: m.instagram || '',
      gender: m.gender || 'Female',
      height: m.height || '',
      measurements: m.measurements || '',
      notes: m.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Model name is required');
      return;
    }
    const cleanPhone = (form.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Phone number is mandatory and must be exactly 10 digits');
      return;
    }
    try {
      const payload = { ...form, phone: cleanPhone };
      if (editingModel) {
        await modelApi.update(editingModel.id, payload);
        toast.success('Model profile updated');
        if (selectedModel?.id === editingModel.id) loadDetail(editingModel);
      } else {
        await modelApi.create(payload);
        toast.success('Model added to roster');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving model');
    }
  };

  const handleDelete = async (id: string, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(`Remove model ${name} from roster?`)) return;
    try {
      await modelApi.delete(id);
      toast.success('Model removed');
      if (selectedModel?.id === id) { setSelectedModel(null); setModelDetail(null); }
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting model');
    }
  };

  // ─── Payment handlers ────────────────────────────────────────
  const openPayModal = () => {
    setPayForm(defaultPaymentForm());
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    setPaySaving(true);
    try {
      await modelApi.recordPayment(modelDetail.id, {
        amount: Number(payForm.amount),
        paymentDate: payForm.paymentDate,
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference || null,
        notes: payForm.notes || null,
      });
      toast.success('Payment recorded');
      setIsPayModalOpen(false);
      loadDetail(modelDetail);
      load(); // refresh list to update pending balance tags
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaySaving(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Delete this payment record? This cannot be undone.')) return;
    try {
      await modelApi.deletePayment(modelDetail.id, paymentId);
      toast.success('Payment record deleted');
      loadDetail(modelDetail);
      load();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* Left Panel */}
      <div className={`flex flex-col bg-white border-r border-gray-100 transition-all duration-200 ${selectedModel ? 'w-[380px] flex-shrink-0' : 'flex-1'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Fashion Models</h1>
            <p className="text-xs text-gray-500">Model roster — {models.length} model{models.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Model
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-50">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text" placeholder="Search models..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs outline-none w-full"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-[#C59B27]/30 border-t-[#C59B27] rounded-full animate-spin" />
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-16 px-4">
              <UserCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No models yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first model to the roster.</p>
              <button onClick={openCreateModal} className="mt-4 px-4 py-2 bg-[#C59B27] text-white text-xs font-semibold rounded-xl">
                Add First Model
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {models.map((m) => {
                const isSelected = selectedModel?.id === m.id;
                const pending = m.pendingBalance || 0;
                const earned = m.totalEarned || 0;
                return (
                  <div
                    key={m.id}
                    onClick={() => loadDetail(m)}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50/80 group ${isSelected ? 'bg-purple-50/60 border-l-2 border-purple-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#C59B27]/10 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-[#C59B27]">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{m.name}</div>
                        <div className="text-xs text-gray-500 truncate">{m.agency || m.gender || 'Independent'}</div>
                        {/* Financial summary tag */}
                        {earned > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-gray-500">
                              {formatCurrency(earned)} earned
                            </span>
                            {pending > 0 ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                ₹{pending.toLocaleString('en-IN')} due
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                All Settled ✓
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={(e) => openEditModal(m, e)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDelete(m.id, m.name, e)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Detail */}
      {selectedModel !== null && (
        <div className="flex-1 overflow-y-auto bg-gray-50/40">
          {detailLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
            </div>
          ) : modelDetail && (
            <div className="max-w-3xl mx-auto p-6 space-y-5">
              {/* Header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#C59B27]/10 flex items-center justify-center text-xl font-bold text-[#C59B27] flex-shrink-0">
                      {modelDetail.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{modelDetail.name}</h2>
                      {modelDetail.agency && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                          <Building2 className="w-3.5 h-3.5" /> {modelDetail.agency}
                        </div>
                      )}
                      {modelDetail.gender && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {modelDetail.gender}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(modelDetail)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setSelectedModel(null)}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {modelDetail.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {modelDetail.phone}
                    </div>
                  )}
                  {modelDetail.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {modelDetail.email}
                    </div>
                  )}
                  {modelDetail.instagram && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <AtSign className="w-3.5 h-3.5 text-gray-400" /> {modelDetail.instagram}
                    </div>
                  )}
                  {modelDetail.height && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Ruler className="w-3.5 h-3.5 text-gray-400" /> {modelDetail.height}
                    </div>
                  )}
                  {modelDetail.measurements && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Ruler className="w-3.5 h-3.5 text-gray-400" /> {modelDetail.measurements}
                    </div>
                  )}
                </div>
                {modelDetail.notes && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">{modelDetail.notes}</p>
                )}
              </div>

              {/* ─── Financial Account Summary ─── */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Shoots', value: String(modelDetail.totalShoots || 0), color: 'text-gray-900', bg: '' },
                  { label: 'Total Earned', value: formatCurrency(modelDetail.totalEarned || 0), color: 'text-[#C59B27]', bg: '' },
                  { label: 'Paid to Model', value: formatCurrency(modelDetail.totalPaid || 0), color: 'text-emerald-600', bg: '' },
                  {
                    label: 'Pending Balance',
                    value: formatCurrency(modelDetail.pendingBalance || 0),
                    color: (modelDetail.pendingBalance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600',
                    bg: (modelDetail.pendingBalance || 0) > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/50 border-emerald-200',
                  },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`rounded-2xl border shadow-sm p-4 text-center ${bg || 'bg-white border-gray-100'}`}>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Record Payment Button */}
              <div className="flex justify-end">
                <button
                  onClick={openPayModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Wallet className="w-3.5 h-3.5" /> Record Payment to {modelDetail.name?.split(' ')[0]}
                </button>
              </div>

              {/* ─── Tabs: Shoots & Earnings / Payments ─── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setDetailTab('shoots')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                      detailTab === 'shoots'
                        ? 'border-[#C59B27] text-[#C59B27]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" /> Shoots & Earnings ({(modelDetail.projectAssignments || []).length})
                  </button>
                  <button
                    onClick={() => setDetailTab('payments')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                      detailTab === 'payments'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Payments Made ({(modelDetail.payments || []).length})
                  </button>
                </div>

                <div className="p-5">
                  {/* Shoots Tab */}
                  {detailTab === 'shoots' && (
                    <>
                      {(modelDetail.projectAssignments || []).length === 0 ? (
                        <p className="text-xs text-gray-400 py-4 text-center">
                          No projects yet. This model will appear in the project model dropdown when assigning.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
                            <span>Project</span><span>Client</span><span>Shoot Date</span><span className="text-right">Rate</span>
                          </div>
                          {(modelDetail.projectAssignments || []).map((a: any) => (
                            <div key={a.id} className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 items-center py-2.5 px-3 bg-gray-50 rounded-xl text-xs">
                              <div>
                                <p className="font-semibold text-gray-900">{a.project?.name || '—'}</p>
                                <p className="text-gray-400 text-[10px]">{a.project?.projectNumber}</p>
                              </div>
                              <p className="text-gray-500 truncate">{a.project?.customer?.companyName || a.project?.customer?.fullName || '—'}</p>
                              <p className="text-gray-500">{a.project?.shootDate ? formatDate(a.project.shootDate) : '—'}</p>
                              <p className="text-right font-bold text-[#C59B27]">{formatCurrency(a.modelRate)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Payments Tab */}
                  {detailTab === 'payments' && (
                    <>
                      {(modelDetail.payments || []).length === 0 ? (
                        <div className="text-center py-6">
                          <Wallet className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400">No payments recorded yet.</p>
                          <button onClick={openPayModal} className="mt-3 text-xs font-semibold text-emerald-600 hover:underline">
                            Record first payment →
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[1fr_100px_80px_1fr_40px] gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
                            <span>Date</span><span>Amount</span><span>Method</span><span>Reference / Notes</span><span></span>
                          </div>
                          {(modelDetail.payments || []).map((p: any) => (
                            <div key={p.id} className="grid grid-cols-[1fr_100px_80px_1fr_40px] gap-3 items-center py-2.5 px-3 bg-emerald-50/40 rounded-xl text-xs border border-emerald-100">
                              <p className="text-gray-700 font-medium">{formatDate(p.paymentDate)}</p>
                              <p className="font-bold text-emerald-700">{formatCurrency(p.amount)}</p>
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-center">
                                {(p.paymentMethod || '').replace(/_/g, ' ')}
                              </span>
                              <p className="text-gray-500 truncate">{p.reference || p.notes || '—'}</p>
                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Create / Edit Model Modal ─── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingModel ? 'Edit Model Profile' : 'Add New Model'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Sharma" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
              <select className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
                value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agency / Representation</label>
              <input className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })}
                placeholder="e.g. Elite Models" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm({ ...form, phone: digits });
                }}
                placeholder="e.g. 9876543210 (10 digits)"
              />
              <p className="text-[10px] text-gray-400 mt-1 flex justify-between">
                <span>Must be exactly 10 digits</span>
                <span className={form.phone.length === 10 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                  {form.phone.length}/10
                </span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="model@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Instagram Handle</label>
              <input className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@username" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
              <input className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="e.g. 5'7&quot;" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Measurements</label>
              <input className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.measurements} onChange={(e) => setForm({ ...form, measurements: e.target.value })}
                placeholder="e.g. 34-26-36" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes…" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancel
            </button>
            <button type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              {editingModel ? 'Save Changes' : 'Add Model'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Record Payment Modal ─── */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment — ${modelDetail?.name || 'Model'}`}>
        <form onSubmit={handlePaySubmit} className="space-y-4">
          {/* Pending Balance Banner */}
          {modelDetail && (
            <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
              (modelDetail.pendingBalance || 0) > 0
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2">
                {(modelDetail.pendingBalance || 0) > 0
                  ? <AlertCircle className="w-4 h-4 text-amber-500" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                }
                <span className="font-semibold">
                  {(modelDetail.pendingBalance || 0) > 0
                    ? `Pending Balance: ${formatCurrency(modelDetail.pendingBalance)}`
                    : 'All Settled — No pending dues'
                  }
                </span>
              </div>
              <span className="text-gray-500">Earned: {formatCurrency(modelDetail.totalEarned || 0)} | Paid: {formatCurrency(modelDetail.totalPaid || 0)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                <input
                  type="number" min={1} required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
              {modelDetail && (modelDetail.pendingBalance || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setPayForm({ ...payForm, amount: String(modelDetail.pendingBalance) })}
                  className="text-[10px] font-semibold text-emerald-600 hover:underline mt-1"
                >
                  Set full pending: ₹{Number(modelDetail.pendingBalance).toLocaleString('en-IN')}
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="date" required
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Ref / UTR</label>
              <input
                value={payForm.reference}
                onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                placeholder="e.g. UTR-123456789"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Optional notes about this payment..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={paySaving}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50">
              {paySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
              {paySaving ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
