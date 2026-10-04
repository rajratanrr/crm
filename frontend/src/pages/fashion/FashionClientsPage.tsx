import { useEffect, useState, useCallback } from 'react';
import {
  Search, Users, Plus, Phone, Mail, Building2, MapPin,
  Briefcase, UserCircle, IndianRupee,
  Edit2, ChevronRight, TrendingUp, Loader2, Trash2,
  Shirt, Calendar, Clock, Link2,
} from 'lucide-react';
import { customerApi, fashionApi, modelApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAutoSync } from '../../hooks/useAutoSync';
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

type DetailTab = 'summary' | 'projects' | 'garments' | 'payments';

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
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const { data } = await customerApi.getAll({ clientType: 'FASHION', search: search || undefined });
      setClients(data.data || []);
    } catch {
      // Background auto-sync fail silently
    } finally {
      setLoading(false);
    }
  }, [search]);

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
    setLoading(true);
    loadClients();
  }, [loadClients]);

  // Real-time cross-employee auto-sync every 8s + on tab focus
  useAutoSync(loadClients, 8000);

  const openCreate = () => {
    setEditingClient(null);
    setForm(defaultForm());
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

  const handleDeleteClient = async (client: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete client "${client.fullName}"? This action cannot be undone.`)) return;
    try {
      await customerApi.delete(client.id);
      toast.success(`Client "${client.fullName}" deleted successfully`);
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
        setClientDetail(null);
      }
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete client');
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
                          {c.city && <span className="text-[10px] text-gray-400">{c.city}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => openEdit(c, e)}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit Client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClient(c, e)}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete Client"
                        >
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
              onDelete={() => handleDeleteClient(selectedClient)}
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
  onDelete,
}: {
  client: any;
  detail: any;
  activeTab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onEdit: () => void;
  onDelete: () => void;
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
    { key: 'projects', label: 'Shoots', icon: Briefcase, count: projects.length },
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all flex-shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Client
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all flex-shrink-0"
              title="Delete Client"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
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
