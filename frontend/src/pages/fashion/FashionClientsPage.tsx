import { useEffect, useState } from 'react';
import {
  Search, Users, Plus, Phone, Mail, Building2, MapPin,
  Briefcase, Shirt, UserCircle, IndianRupee,
  Edit2, ChevronRight, Calendar, TrendingUp, Loader2, Trash2,
  Film, Tag, Link2, Clock, Check, ExternalLink, Sparkles,
} from 'lucide-react';
import { customerApi, fashionApi, modelApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export const SHOOT_TYPES = [
  { value: 'PHOTO', label: 'Photo Only' },
  { value: 'PHOTO_VIDEO', label: 'Photo + Video' },
  { value: 'VIDEO', label: 'Video Only' },
  { value: 'UGC_CREATIVE', label: 'UGC / Creative' },
  { value: 'LOOKBOOK', label: 'Lookbook' },
  { value: 'ECOM_CATALOG', label: 'E-Commerce / Catalog' },
  { value: 'CAMPAIGN', label: 'Campaign / Editorial' },
  { value: 'REEL', label: 'Reels / Short Video' },
  { value: 'FLAT_LAY', label: 'Flat Lay / Mannequin' },
];

export const PRODUCT_TYPES = [
  'Saree',
  'Kurti',
  'Lehenga',
  'Western / Gown',
  'Shirt / Top',
  'Bottom / Pants',
  'Sherwani / Men',
  'Fusion / Indo-Western',
  'Kids Wear',
  'Jewellery / Accessories',
  'Footwear',
  'Other',
];

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const PAY_STATUS_COLORS: Record<string, string> = {
  ADVANCE: 'bg-blue-50 text-blue-700',
  PENDING: 'bg-amber-50 text-amber-700',
  DONE: 'bg-emerald-50 text-emerald-700',
};

type DetailTab = 'summary' | 'projects' | 'models' | 'garments' | 'payments';

interface ClientModelRow {
  modelId: string;
  defaultRate: number | string;
  notes?: string;
  model?: any;
}

function defaultForm() {
  return {
    fullName: '',
    phone: '',
    email: '',
    companyName: '',
    city: '',
    notes: '',
    garmentCount: '',
    shootType: '',
    productType: '',
    projectAmount: '',
    studioAmount: '',
    shootDate: '',
    clothInDate: '',
    clothOutDate: '',
    driveLink: '',
    clientType: 'FASHION',
  };
}

export default function FashionClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState(defaultForm());
  const [allModels, setAllModels] = useState<any[]>([]);
  const [clientModels, setClientModels] = useState<ClientModelRow[]>([]);
  const [saving, setSaving] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data } = await customerApi.getAll({ clientType: 'FASHION', search: search || undefined });
      setClients(data.data || []);
    } catch {
      toast.error('Failed to load Fashion clients');
    } finally {
      setLoading(false);
    }
  };

  const loadAllModels = async () => {
    try {
      const { data } = await modelApi.getAll();
      setAllModels(data.data || []);
    } catch {}
  };

  const loadDetail = async (client: any) => {
    setSelectedClient(client);
    setDetailLoading(true);
    try {
      const { data } = await fashionApi.getClientFinancialSummary(client.id);
      setClientDetail(data.data);
    } catch {
      toast.error('Failed to load client details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
    loadAllModels();
  }, [search]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(defaultForm());
    setClientModels([]);
    setIsModalOpen(true);
  };

  const openEdit = async (c: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClient(c);
    setForm({
      fullName: c.fullName || '',
      phone: (c.phone || '').replace(/\D/g, '').slice(0, 10),
      email: c.email || '',
      companyName: c.companyName || '',
      city: c.city || '',
      notes: c.notes || '',
      garmentCount: c.garmentCount != null && c.garmentCount !== undefined ? String(c.garmentCount) : '',
      shootType: c.shootType || '',
      productType: c.productType || '',
      projectAmount: c.projectAmount ? String(c.projectAmount) : '',
      studioAmount: c.studioAmount ? String(c.studioAmount) : '',
      shootDate: c.shootDate ? c.shootDate.split('T')[0] : '',
      clothInDate: c.clothInDate ? c.clothInDate.split('T')[0] : '',
      clothOutDate: c.clothOutDate ? c.clothOutDate.split('T')[0] : '',
      driveLink: c.driveLink || '',
      clientType: 'FASHION',
    });

    if (c.fashionClientModels && c.fashionClientModels.length > 0) {
      setClientModels(
        c.fashionClientModels.map((cm: any) => ({
          modelId: cm.modelId,
          defaultRate: cm.defaultRate || 0,
          notes: cm.notes || '',
          model: cm.model,
        }))
      );
    } else {
      try {
        const { data } = await customerApi.getClientModels(c.id);
        setClientModels(
          (data.data || []).map((cm: any) => ({
            modelId: cm.modelId,
            defaultRate: cm.defaultRate || 0,
            notes: cm.notes || '',
            model: cm.model,
          }))
        );
      } catch {
        setClientModels([]);
      }
    }
    setIsModalOpen(true);
  };

  const toggleShootType = (val: string) => {
    const current = form.shootType ? form.shootType.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let updated: string[];
    if (current.includes(val)) {
      updated = current.filter((x) => x !== val);
    } else {
      updated = [...current, val];
    }
    setForm((prev) => ({ ...prev, shootType: updated.join(', ') }));
  };

  const toggleProductType = (val: string) => {
    const current = form.productType ? form.productType.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let updated: string[];
    if (current.includes(val)) {
      updated = current.filter((x) => x !== val);
    } else {
      updated = [...current, val];
    }
    setForm((prev) => ({ ...prev, productType: updated.join(', ') }));
  };

  const toggleModel = (modelId: string) => {
    if (clientModels.some((cm) => cm.modelId === modelId)) {
      setClientModels((prev) => prev.filter((cm) => cm.modelId !== modelId));
    } else {
      const found = allModels.find((m) => m.id === modelId);
      setClientModels((prev) => [
        ...prev,
        { modelId, defaultRate: 0, notes: '', model: found },
      ]);
    }
  };

  const addModelToClient = (modelId: string) => {
    if (!modelId) return;
    if (clientModels.some((cm) => cm.modelId === modelId)) {
      toast.error('Model already assigned to this client');
      return;
    }
    const found = allModels.find((m) => m.id === modelId);
    setClientModels((prev) => [
      ...prev,
      { modelId, defaultRate: 0, notes: '', model: found },
    ]);
  };

  const updateClientModelRate = (idx: number, rate: any) => {
    setClientModels((prev) =>
      prev.map((cm, i) => (i === idx ? { ...cm, defaultRate: rate } : cm))
    );
  };

  const updateClientModelNotes = (idx: number, notes: string) => {
    setClientModels((prev) =>
      prev.map((cm, i) => (i === idx ? { ...cm, notes } : cm))
    );
  };

  const removeClientModel = (idx: number) => {
    setClientModels((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Client name is required');
      return;
    }
    const cleanPhone = (form.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Phone number is mandatory and must be exactly 10 digits');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        phone: cleanPhone,
        garmentCount: form.garmentCount !== '' ? parseInt(String(form.garmentCount), 10) || 0 : 0,
        projectAmount: form.projectAmount !== '' ? Number(form.projectAmount) || 0 : 0,
        studioAmount: form.studioAmount !== '' ? Number(form.studioAmount) || 0 : 0,
        shootDate: form.shootDate || null,
        clothInDate: form.clothInDate || null,
        clothOutDate: form.clothOutDate || null,
        driveLink: form.driveLink || null,
        shootType: form.shootType || null,
        productType: form.productType || null,
        clientModels: clientModels
          .filter((cm) => cm.modelId)
          .map((cm) => ({
            modelId: cm.modelId,
            defaultRate: Number(cm.defaultRate) || 0,
            notes: cm.notes || null,
          })),
      };

      if (editingClient) {
        const res = await customerApi.update(editingClient.id, payload);
        toast.success('Client and photoshoot details updated');
        if (selectedClient?.id === editingClient.id) {
          loadDetail(res.data?.data || editingClient);
        }
      } else {
        await customerApi.create(payload);
        toast.success('Fashion client created with photoshoot settings');
      }
      setIsModalOpen(false);
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* Left Panel */}
      <div className={`flex flex-col bg-white border-r border-gray-100 transition-all duration-200 ${selectedClient ? 'w-[380px] flex-shrink-0' : 'flex-1'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Fashion Clients</h1>
            <p className="text-xs text-gray-500">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        </div>

        <div className="p-3 border-b border-gray-50">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs outline-none w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-7 h-7 border-2 border-[#C59B27]/30 border-t-[#C59B27] rounded-full animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No fashion clients yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first client to get started.</p>
              <button onClick={openCreate} className="mt-4 px-4 py-2 bg-[#C59B27] text-white text-xs font-semibold rounded-xl">
                Add First Client
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clients.map((c) => {
                const isSelected = selectedClient?.id === c.id;
                const modelsCount = c.fashionClientModels?.length || 0;
                return (
                  <div
                    key={c.id}
                    onClick={() => { setActiveTab('projects'); loadDetail(c); }}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50/80 group ${isSelected ? 'bg-purple-50/60 border-l-2 border-purple-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#C59B27]/10 flex items-center justify-center flex-shrink-0 font-semibold text-sm text-[#C59B27]">
                        {c.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{c.fullName}</div>
                        <div className="text-xs text-gray-500 truncate">{c.companyName || c.phone || 'No contact info'}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {modelsCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                              {modelsCount} model{modelsCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {Boolean(c.garmentCount && c.garmentCount > 0) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium flex items-center gap-0.5">
                              <Shirt className="w-2.5 h-2.5" />
                              {c.garmentCount} dresses
                            </span>
                          )}
                          {c.shootType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium flex items-center gap-0.5">
                              <Film className="w-2.5 h-2.5" />
                              {c.shootType}
                            </span>
                          )}
                          {c.productType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 font-medium flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              {c.productType}
                            </span>
                          )}
                          {Boolean(c.projectAmount && Number(c.projectAmount) > 0) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                              {formatCurrency(c.projectAmount)}
                            </span>
                          )}
                          {c.clothInDate && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              In: {formatDate(c.clothInDate)}
                            </span>
                          )}
                          {c.city && <span className="text-[10px] text-gray-400">{c.city}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => openEdit(c, e)}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit Client & Model Rates"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Right Panel */}
      {selectedClient !== null && (
        <div className="flex-1 overflow-y-auto bg-gray-50/40">
          {detailLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
            </div>
          ) : clientDetail && (
            <ClientDetail
              client={selectedClient}
              detail={clientDetail}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={() => openEdit(selectedClient)}
            />
          )}
        </div>
      )}

      {/* Modal: New / Edit Client with Assigned Models & Rates */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Fashion Client & Model Rates' : 'New Fashion Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name / Contact Name *</label>
              <input
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Anjali Mehta"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company / Brand Name</label>
              <input
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Ananya Sarees Pvt Ltd"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai"
              />
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
              <input
                type="email"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@brand.com"
              />
            </div>
            {/* ─── Photoshoot Specification: Shoot Type & Product Type (Dropdown + Checkboxes to tick) ─── */}
            <div className="md:col-span-2 pt-3 border-t border-gray-100 space-y-3">
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3.5 space-y-3">
                {/* 1. Shoot Type */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-purple-600" />
                      Shoot Type <span className="text-[11px] text-gray-400 font-normal">(choose from dropdown or tick checkboxes below)</span>
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          toggleShootType(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27] font-medium text-gray-700"
                    >
                      <option value="">+ Add / Select Shoot Type...</option>
                      {SHOOT_TYPES.map((st) => (
                        <option key={st.value} value={st.label}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Checkbox pills to tick */}
                  <div className="flex flex-wrap gap-1.5">
                    {SHOOT_TYPES.map((st) => {
                      const selectedTypes = form.shootType
                        ? form.shootType.split(',').map((s) => s.trim().toLowerCase())
                        : [];
                      const isChecked =
                        selectedTypes.includes(st.label.toLowerCase()) ||
                        selectedTypes.includes(st.value.toLowerCase());
                      return (
                        <button
                          type="button"
                          key={st.value}
                          onClick={() => toggleShootType(st.label)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            isChecked
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                              isChecked ? 'bg-white text-purple-700' : 'border border-gray-300'
                            }`}
                          >
                            {isChecked ? '✓' : ''}
                          </span>
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                  {form.shootType && (
                    <p className="text-[11px] text-purple-700 font-semibold mt-1">
                      Selected: {form.shootType}
                    </p>
                  )}
                </div>

                {/* 2. Product Type */}
                <div className="pt-2.5 border-t border-purple-100">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      Product Type / Outfits <span className="text-[11px] text-gray-400 font-normal">(tick multiple checkboxes or select dropdown)</span>
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          toggleProductType(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27] font-medium text-gray-700"
                    >
                      <option value="">+ Add / Select Product Type...</option>
                      {PRODUCT_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Checkbox pills to tick */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRODUCT_TYPES.map((pt) => {
                      const selectedProds = form.productType
                        ? form.productType.split(',').map((s) => s.trim().toLowerCase())
                        : [];
                      const isChecked = selectedProds.includes(pt.toLowerCase());
                      return (
                        <button
                          type="button"
                          key={pt}
                          onClick={() => toggleProductType(pt)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            isChecked
                              ? 'bg-[#C59B27] text-white border-[#C59B27] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-[#C59B27]/40'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                              isChecked ? 'bg-white text-[#C59B27]' : 'border border-gray-300'
                            }`}
                          >
                            {isChecked ? '✓' : ''}
                          </span>
                          {pt}
                        </button>
                      );
                    })}
                  </div>
                  {form.productType && (
                    <p className="text-[11px] text-[#C59B27] font-semibold mt-1">
                      Included Outfits: {form.productType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Shoot Metrics: Qty, Amount, Studio Amount ─── */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Qty / Total Dresses <span className="text-gray-400 font-normal">— photoshoot looks</span>
              </label>
              <div className="relative">
                <Shirt className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min={0}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                  value={form.garmentCount}
                  onChange={(e) => setForm({ ...form, garmentCount: e.target.value })}
                  placeholder="e.g. 15 (total dresses)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Agreed Shoot Amount (₹) <span className="text-gray-400 font-normal">— client contract</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min={0}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-semibold"
                  value={form.projectAmount}
                  onChange={(e) => setForm({ ...form, projectAmount: e.target.value })}
                  placeholder="e.g. 65000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Studio Amount (₹) <span className="text-gray-400 font-normal">— production / bay cost</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min={0}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-semibold"
                  value={form.studioAmount}
                  onChange={(e) => setForm({ ...form, studioAmount: e.target.value })}
                  placeholder="e.g. 25000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Photoshoot Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                  value={form.shootDate}
                  onChange={(e) => setForm({ ...form, shootDate: e.target.value })}
                />
              </div>
            </div>

            {/* ─── Cloth In & Out Dates ─── */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cloth In Date <span className="text-gray-400 font-normal">— samples arrival at studio</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-indigo-200 bg-indigo-50/20 rounded-lg outline-none focus:border-indigo-400"
                  value={form.clothInDate}
                  onChange={(e) => setForm({ ...form, clothInDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cloth Out Date <span className="text-gray-400 font-normal">— returned/dispatched</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-emerald-200 bg-emerald-50/20 rounded-lg outline-none focus:border-emerald-400"
                  value={form.clothOutDate}
                  onChange={(e) => setForm({ ...form, clothOutDate: e.target.value })}
                />
              </div>
            </div>

            {/* ─── Google Drive Delivery Link ─── */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" /> Google Drive Link <span className="text-gray-400 font-normal">— shoot raw / edited files</span>
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                value={form.driveLink}
                onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Brand preferences, styling guidelines, shoot notes…"
              />
            </div>

            {/* ─── Assigned Models & Model Rate For This Client (with Checkbox Quick-Tick) ─── */}
            <div className="md:col-span-2 pt-3 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-[#C59B27]" />
                    Assign Models & Set Agreed Client Rates
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Tick checkboxes below or use the dropdown to assign models and specify client rates.
                  </p>
                </div>
                {/* Dropdown of model list */}
                <div className="flex-shrink-0">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addModelToClient(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27] font-medium text-gray-700"
                  >
                    <option value="">+ Assign Model from List...</option>
                    {allModels
                      .filter((m) => !clientModels.some((cm) => cm.modelId === m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.gender ? `(${m.gender})` : ''} {m.agency ? `· ${m.agency}` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Model Checklist: checkboxes to tick! */}
              {allModels.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-2.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Quick-Tick Models from Roster:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allModels.map((m) => {
                      const isAssigned = clientModels.some((cm) => cm.modelId === m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => toggleModel(m.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            isAssigned
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                              isAssigned ? 'bg-white text-purple-700' : 'border border-gray-300'
                            }`}
                          >
                            {isAssigned ? '✓' : ''}
                          </span>
                          <span>{m.name}</span>
                          {m.gender && <span className="text-[10px] opacity-80">({m.gender})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {clientModels.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium">No models assigned to this client yet</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Use the dropdown above to choose models from your model list and enter their rates for this client.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_32px] gap-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Model</span>
                    <span>Model Rate for Client (₹) *</span>
                    <span>Notes</span>
                    <span />
                  </div>
                  {clientModels.map((cm, idx) => {
                    const modelObj = cm.model || allModels.find((m) => m.id === cm.modelId);
                    return (
                      <div
                        key={cm.modelId || idx}
                        className="grid grid-cols-[2fr_1.5fr_1.5fr_32px] gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {modelObj?.name || 'Assigned Model'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {modelObj?.gender || ''} {modelObj?.agency ? `· ${modelObj.agency}` : ''}
                          </p>
                        </div>
                        <div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs text-gray-400 font-medium">₹</span>
                            <input
                              type="number"
                              min={0}
                              required
                              placeholder="e.g. 15000"
                              value={cm.defaultRate}
                              onChange={(e) => updateClientModelRate(idx, e.target.value)}
                              className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-semibold text-gray-800"
                            />
                          </div>
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="e.g. per day shoot"
                            value={cm.notes || ''}
                            onChange={(e) => updateClientModelNotes(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeClientModel(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingClient ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Detail Component ────────────────────────────────────────────────────────

function ClientDetail({
  client,
  detail,
  activeTab,
  onTabChange,
  onEdit,
}: {
  client: any;
  detail: any;
  activeTab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onEdit: () => void;
}) {
  const {
    projects = [],
    payments = [],
    modelAssignments = [],
    garments = [],
    clientModels = client.fashionClientModels || [],
    summary = {},
  } = detail;

  const tabs: { key: DetailTab; label: string; icon: any; count?: number }[] = [
    { key: 'summary', label: 'Overview', icon: TrendingUp },
    { key: 'projects', label: 'Projects', icon: Briefcase, count: projects.length },
    { key: 'models', label: 'Models & Pricing', icon: UserCircle, count: (clientModels.length || modelAssignments.length) },
    { key: 'garments', label: 'Garments', icon: Shirt, count: garments.length },
    { key: 'payments', label: 'Payments', icon: IndianRupee, count: payments.length },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#C59B27]/10 flex items-center justify-center text-lg font-bold text-[#C59B27] flex-shrink-0">
              {client.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{client.fullName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">FASHION</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                {client.companyName && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> {client.companyName}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {client.email}
                  </span>
                )}
                {client.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {client.city}
                  </span>
                )}
                {Boolean(client.garmentCount && client.garmentCount > 0) && (
                  <span className="flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    <Shirt className="w-3.5 h-3.5 text-purple-600" />
                    {client.garmentCount} photoshoot dresses/garments
                  </span>
                )}
                {client.shootType && (
                  <span className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    <Film className="w-3.5 h-3.5 text-blue-600" /> {client.shootType}
                  </span>
                )}
                {client.productType && (
                  <span className="flex items-center gap-1 font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md">
                    <Tag className="w-3.5 h-3.5 text-pink-600" /> {client.productType}
                  </span>
                )}
                {(client.clothInDate || client.clothOutDate) && (
                  <span className="flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Cloth In: {client.clothInDate ? formatDate(client.clothInDate) : '—'} · Out: {client.clothOutDate ? formatDate(client.clothOutDate) : '—'}
                  </span>
                )}
                {client.driveLink && (
                  <a
                    href={client.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-md transition-all"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Drive Link ↗
                  </a>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all flex-shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Client & Shoot Specs
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1 border-b border-gray-100 bg-white px-4 rounded-2xl shadow-sm">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === key ? 'border-[#C59B27] text-[#C59B27]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
            {count !== undefined && count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-900 mb-2">Financial Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Contract Value', value: formatCurrency(summary.totalContractValue ?? 0), color: 'text-gray-900' },
              { label: 'Total Received (ADVANCE + DONE)', value: formatCurrency(summary.totalReceived ?? 0), color: 'text-emerald-600' },
              { label: 'Total Pending', value: formatCurrency(summary.totalPending ?? 0), color: 'text-amber-600' },
              { label: 'Total Garments Sent', value: `${summary.totalGarments ?? 0} pieces`, color: 'text-purple-600' },
              ...(client.projectAmount && Number(client.projectAmount) > 0
                ? [{ label: 'Agreed Shoot Target', value: formatCurrency(client.projectAmount), color: 'text-[#C59B27]' }]
                : []),
              ...(client.studioAmount && Number(client.studioAmount) > 0
                ? [{ label: 'Studio Production Cost', value: formatCurrency(client.studioAmount), color: 'text-indigo-600' }]
                : []),
              ...(client.garmentCount && client.garmentCount > 0
                ? [{ label: 'Target Dress Count', value: `${client.garmentCount} dresses`, color: 'text-purple-700' }]
                : []),
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Photoshoot Specification & Logistics Card */}
          <div className="bg-purple-50/40 rounded-2xl border border-purple-100 p-4 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Photoshoot Specifications &amp; Logistics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Shoot Type</span>
                <span className="font-semibold text-gray-900 mt-0.5 block">{client.shootType || 'Standard'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Product / Outfits</span>
                <span className="font-semibold text-gray-900 mt-0.5 block truncate" title={client.productType || 'All'}>{client.productType || 'All Products'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Cloth In Date</span>
                <span className="font-semibold text-indigo-700 mt-0.5 block">{client.clothInDate ? formatDate(client.clothInDate) : 'Not Scheduled'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Cloth Out Date</span>
                <span className="font-semibold text-emerald-700 mt-0.5 block">{client.clothOutDate ? formatDate(client.clothOutDate) : 'Not Scheduled'}</span>
              </div>
            </div>
            {client.shootDate && (
              <div className="bg-white p-2.5 rounded-xl border border-purple-100 text-xs flex items-center justify-between">
                <span className="text-gray-500 font-medium">Scheduled Photoshoot Date:</span>
                <strong className="text-purple-900 font-bold">{formatDate(client.shootDate)}</strong>
              </div>
            )}
            {client.driveLink && (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100 text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 truncate mr-2">
                  <Link2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <strong>Delivery Drive:</strong> <span className="truncate">{client.driveLink}</span>
                </span>
                <a
                  href={client.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all flex-shrink-0"
                >
                  Open Drive ↗
                </a>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Projects ({projects.length})</h3>
          {projects.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No projects yet for this client.</p>
          ) : (
            <div className="space-y-2.5">
              {projects.map((p: any) => (
                <div key={p.id} className="p-3.5 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                        {p.shootType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                            {p.shootType}
                          </span>
                        )}
                        {p.productType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 font-medium">
                            {p.productType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{p.projectNumber}</span>
                        {p.shootDate && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 text-purple-600" /> Shoot: {formatDate(p.shootDate)}
                          </span>
                        )}
                        {(p.clothInDate || p.clothOutDate) && (
                          <span className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                            <Clock className="w-3 h-3" />
                            Cloth In: {p.clothInDate ? formatDate(p.clothInDate) : '—'} · Out: {p.clothOutDate ? formatDate(p.clothOutDate) : '—'}
                          </span>
                        )}
                        {p.driveLink && (
                          <a href={p.driveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline">
                            <Link2 className="w-3 h-3" /> Drive
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${STATUS_COLORS[p.status] || STATUS_COLORS.PLANNING}`}>
                        {p.status?.replace(/_/g, ' ')}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(p.budget)}</p>
                        <p className="text-[10px] text-gray-400">Contract</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'models' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
          {/* 1. Client-level agreed model rates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-[#C59B27]" />
                  Agreed Client Model Rates ({clientModels.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pre-agreed rates for models given to this client. Auto-inherited on new projects.
                </p>
              </div>
              <button
                onClick={onEdit}
                className="px-3 py-1 text-xs font-semibold text-[#C59B27] bg-[#C59B27]/10 hover:bg-[#C59B27]/20 rounded-lg transition-all"
              >
                Manage Rates
              </button>
            </div>

            {clientModels.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
                No model rates configured for this client. Click &quot;Manage Rates&quot; to assign models.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_100px] gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                  <span>Model</span>
                  <span>Agency / Gender</span>
                  <span>Notes</span>
                  <span className="text-right">Agreed Rate</span>
                </div>
                {clientModels.map((cm: any) => (
                  <div
                    key={cm.id || cm.modelId}
                    className="grid grid-cols-[2fr_1.5fr_1.5fr_100px] gap-3 items-center py-2.5 px-3 bg-gray-50 rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{cm.model?.name || 'Model'}</p>
                      {cm.model?.phone && <p className="text-[10px] text-gray-400">{cm.model.phone}</p>}
                    </div>
                    <p className="text-gray-500">
                      {cm.model?.agency || 'Independent'} {cm.model?.gender ? `· ${cm.model.gender}` : ''}
                    </p>
                    <p className="text-gray-400 italic truncate">{cm.notes || '—'}</p>
                    <p className="text-right font-bold text-[#C59B27]">{formatCurrency(cm.defaultRate)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Project shoot assignments */}
          {modelAssignments.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Project Shoot History ({modelAssignments.length})</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                  <span>Model</span>
                  <span>Project</span>
                  <span>Shoot Date</span>
                  <span className="text-right">Rate</span>
                </div>
                {modelAssignments.map((a: any) => (
                  <div key={a.id} className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 items-center py-2.5 px-3 bg-gray-50 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-gray-900">{a.model?.name || '—'}</p>
                      <p className="text-gray-400 text-[10px]">{a.model?.gender}</p>
                    </div>
                    <p className="text-gray-500 truncate">{a.project?.name || '—'}</p>
                    <p className="text-gray-500">{a.project?.shootDate ? formatDate(a.project.shootDate) : '—'}</p>
                    <p className="text-right font-bold text-[#C59B27]">{formatCurrency(a.modelRate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'garments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Garments Sent ({garments.length} lines · {summary.totalGarments ?? 0} pieces)</h3>
          {garments.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No garment records yet. Add garments in project details.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[80px_2fr_1fr_50px] gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1">
                <span>Type</span><span>Dress / Item</span><span>Project</span><span className="text-right">Qty</span>
              </div>
              {garments.map((g: any) => (
                <div key={g.id} className="grid grid-cols-[80px_2fr_1fr_50px] gap-3 items-center py-2.5 px-3 bg-gray-50 rounded-xl text-xs">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-center">{g.clothType}</span>
                  <p className="font-semibold text-gray-900">{g.dressName}</p>
                  <p className="text-gray-500 truncate">{g.project?.name || '—'}</p>
                  <p className="text-right font-bold text-gray-900">{g.quantity}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Payments ({payments.length})</h3>
          {payments.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No payments yet. Record payments from the project detail page.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((pay: any) => {
                const st = pay.paymentStatus || 'ADVANCE';
                return (
                  <div key={pay.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${PAY_STATUS_COLORS[st] || PAY_STATUS_COLORS.ADVANCE}`}>{st}</span>
                      <span className="text-gray-500">{pay.paymentMethod?.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400">{formatDate(pay.paymentDate)}</span>
                      {pay.notes && <span className="text-gray-400 italic">{pay.notes}</span>}
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(pay.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
