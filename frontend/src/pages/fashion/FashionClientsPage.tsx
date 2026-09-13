import { useEffect, useState } from 'react';
import {
  Search, Users, Plus, Phone, Mail, Building2, MapPin,
  Briefcase, Shirt, UserCircle, IndianRupee, X,
  Edit2, ChevronRight, Calendar, TrendingUp,
} from 'lucide-react';
import { customerApi, fashionApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

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

function defaultForm() {
  return {
    fullName: '', phone: '', email: '', companyName: '',
    city: '', notes: '', clientType: 'FASHION',
  };
}

export default function FashionClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'models' | 'garments' | 'payments' | 'summary'>('projects');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState(defaultForm());

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

  useEffect(() => { loadClients(); }, [search]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(defaultForm());
    setIsModalOpen(true);
  };

  const openEdit = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(c);
    setForm({
      fullName: c.fullName || '',
      phone: c.phone || '',
      email: c.email || '',
      companyName: c.companyName || '',
      city: c.city || '',
      notes: c.notes || '',
      clientType: 'FASHION',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName) { toast.error('Client name is required'); return; }
    try {
      if (editingClient) {
        await customerApi.update(editingClient.id, form);
        toast.success('Client updated');
        if (selectedClient?.id === editingClient.id) loadDetail(editingClient);
      } else {
        await customerApi.create(form);
        toast.success('Fashion client created');
      }
      setIsModalOpen(false);
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving client');
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete client "${name}"? Their project history will remain.`)) return;
    try {
      await customerApi.delete(id);
      toast.success('Client deleted');
      if (selectedClient?.id === id) { setSelectedClient(null); setClientDetail(null); }
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting client');
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Fashion Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Body — split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r overflow-hidden"
          style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…" className="input w-full pl-8 py-2 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <Users size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No Fashion clients yet</p>
                <button onClick={openCreate} className="btn-primary mt-3 text-xs py-1.5 px-3">+ Add First Client</button>
              </div>
            ) : (
              clients.map((c) => (
                <div key={c.id} onClick={() => { setActiveTab('projects'); loadDetail(c); }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors group ${selectedClient?.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  style={{ borderBottomColor: 'var(--color-border)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                    style={{ background: 'var(--color-accent)', color: 'white' }}>
                    {c.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{c.fullName}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {c.companyName || c.phone || c.email || 'No contact info'}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEdit(c, e)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                      <Edit2 size={13} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} className="flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto">
          {!selectedClient ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <Users size={56} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a client to view their profile</p>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="py-16 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
          ) : clientDetail ? (
            <ClientDetail
              client={selectedClient}
              detail={clientDetail}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={(e) => openEdit(selectedClient, e)}
              onDelete={(e) => handleDelete(selectedClient.id, selectedClient.fullName, e)}
            />
          ) : null}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Fashion Client' : 'Add Fashion Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Full Name / Contact Name *</label>
              <input className="input w-full" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Anjali Mehta" required />
            </div>
            <div>
              <label className="form-label">Company / Brand Name</label>
              <input className="input w-full" value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Ananya Sarees Pvt Ltd" />
            </div>
            <div>
              <label className="form-label">City</label>
              <input className="input w-full" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="input w-full" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="input w-full" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@brand.com" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Notes</label>
              <textarea className="input w-full" rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Brand description, preferences…" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editingClient ? 'Save Changes' : 'Create Client'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────

type DetailTab = 'projects' | 'models' | 'garments' | 'payments' | 'summary';

function ClientDetail({ client, detail, activeTab, onTabChange, onEdit, onDelete }: {
  client: any;
  detail: any;
  activeTab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { projects = [], payments = [], modelAssignments = [], garments = [], summary = {} } = detail;

  const tabs: { key: DetailTab; label: string; icon: any; count?: number }[] = [
    { key: 'summary', label: 'Summary', icon: TrendingUp },
    { key: 'projects', label: 'Projects', icon: Briefcase, count: projects.length },
    { key: 'models', label: 'Models', icon: UserCircle, count: modelAssignments.length },
    { key: 'garments', label: 'Garments', icon: Shirt, count: garments.length },
    { key: 'payments', label: 'Payments', icon: IndianRupee, count: payments.length },
  ];

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: 'var(--color-accent)', color: 'white' }}>
              {client.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{client.fullName}</h2>
              {client.companyName && (
                <div className="flex items-center gap-1.5 mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Building2 size={13} /> {client.companyName}
                </div>
              )}
              <div className="flex flex-wrap gap-4 mt-2">
                {client.phone && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <Phone size={12} /> {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <Mail size={12} /> {client.email}
                  </span>
                )}
                {client.city && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <MapPin size={12} /> {client.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
              <Edit2 size={13} /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Projects', value: summary.projectCount ?? 0, color: 'text-indigo-600' },
          { label: 'Contract Value', value: formatCurrency(summary.totalContractValue ?? 0), color: 'text-gray-900' },
          { label: 'Total Received', value: formatCurrency(summary.totalReceived ?? 0), color: 'text-emerald-600' },
          { label: 'Total Pending', value: formatCurrency(summary.totalPending ?? 0), color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={{ color: activeTab === key ? undefined : 'var(--color-text-secondary)' }}
          >
            <Icon size={14} /> {label}
            {count !== undefined && count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Contract Value (all projects)', value: formatCurrency(summary.totalContractValue ?? 0), color: 'text-gray-900' },
                { label: 'Total Received (ADVANCE + DONE)', value: formatCurrency(summary.totalReceived ?? 0), color: 'text-emerald-600' },
                { label: 'Total Pending (not yet received)', value: formatCurrency(summary.totalPending ?? 0), color: 'text-amber-600' },
                { label: 'Total Garments Sent', value: `${summary.totalGarments ?? 0} pieces`, color: 'text-purple-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {client.notes && (
            <div className="card p-5">
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Notes</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Projects ({projects.length})
          </h3>
          {projects.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No projects yet for this client.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b gap-4"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.projectNumber}</span>
                      {p.shootDate && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <Calendar size={11} /> {formatDate(p.shootDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${STATUS_COLORS[p.status] || STATUS_COLORS.PLANNING}`}>
                      {p.status?.replace(/_/g, ' ')}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(p.budget)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Contract</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'models' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Models & Pricing ({modelAssignments.length})
          </h3>
          {modelAssignments.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No model assignments yet. Assign models in project details.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Model</th>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Project</th>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Shoot Date</th>
                    <th className="text-right pb-2 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {modelAssignments.map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="py-3 pr-4">
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{a.model?.name || '—'}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{a.model?.gender}</div>
                      </td>
                      <td className="py-3 pr-4" style={{ color: 'var(--color-text-secondary)' }}>
                        {a.project?.name || '—'}
                      </td>
                      <td className="py-3 pr-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {a.project?.shootDate ? formatDate(a.project.shootDate) : '—'}
                      </td>
                      <td className="py-3 text-right font-semibold" style={{ color: 'var(--color-accent)' }}>
                        {formatCurrency(a.modelRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'garments' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Garments Sent ({garments.length} lines · {summary.totalGarments ?? 0} pieces total)
          </h3>
          {garments.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No garment records yet. Add garments in project details.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cloth Type</th>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Dress / Item</th>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Project</th>
                    <th className="text-right pb-2 font-medium text-xs" style={{ color: 'var(--color-text-secondary)' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {garments.map((g: any) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{g.clothType}</span>
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--color-text-primary)' }}>{g.dressName}</td>
                      <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {g.project?.name || '—'}
                      </td>
                      <td className="py-2.5 text-right font-semibold" style={{ color: 'var(--color-text-primary)' }}>{g.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Payments ({payments.length})
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No payments yet. Record payments from the project detail page.
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((pay: any) => {
                const st = pay.paymentStatus || 'ADVANCE';
                return (
                  <div key={pay.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg"
                    style={{ background: 'var(--color-bg-secondary)' }}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${PAY_STATUS_COLORS[st] || PAY_STATUS_COLORS.ADVANCE}`}>
                        {st}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {pay.paymentMethod?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(pay.paymentDate)}
                      </span>
                      {pay.notes && (
                        <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                          {pay.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(pay.amount)}
                    </span>
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
