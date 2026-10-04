import { useEffect, useState } from 'react';
import { Plus, Package as PackageIcon, Search, Edit2, Trash2, CheckCircle2, Clock, FileText, Sparkles, X, Share2, Copy, MessageCircle, Check, Send } from 'lucide-react';
import { packageApi, customerApi, projectApi, formatDate } from '../../services/api';
import { formatCurrency } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

interface ServiceItem {
  serviceName: string;
  description?: string;
  quantity?: number;
}

export default function PackagesPage({ defaultDomain }: { defaultDomain?: 'WEDDING' | 'FASHION' }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WEDDING' | 'FASHION'>(defaultDomain || 'ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sharing State
  const [sharingPackage, setSharingPackage] = useState<any>(null);
  const [shareClientName, setShareClientName] = useState('');
  const [shareClientPhone, setShareClientPhone] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [shareNotes, setShareNotes] = useState('');
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [existingShares, setExistingShares] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    domain: defaultDomain || 'WEDDING',
    basePrice: '',
    duration: '',
    description: '',
    services: [] as ServiceItem[],
  });

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const load = async () => {
    setLoading(true);
    const domainToFetch = defaultDomain ? defaultDomain : activeTab !== 'ALL' ? activeTab : undefined;
    try {
      const { data } = await packageApi.getAll({
        domain: domainToFetch,
        search: search.trim() || undefined,
      });
      setPackages(data.data || []);
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeTab, defaultDomain, search]);

  const openCreateModal = () => {
    setEditingPackage(null);
    setForm({
      name: '',
      domain: defaultDomain || 'WEDDING',
      basePrice: '',
      duration: '',
      description: '',
      services: [
        { serviceName: 'Candid Photography', description: 'Lead candid shooter' },
        { serviceName: 'Cinematic Film', description: '4K stabilized camera' },
        { serviceName: 'Flush-Mount Album', description: 'Handcrafted photo book' },
      ],
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setShowModal(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      domain: pkg.domain || 'WEDDING',
      basePrice: String(pkg.basePrice || ''),
      duration: pkg.duration || '',
      description: pkg.description || '',
      services: pkg.services ? pkg.services.map((s: any) => ({
        serviceName: s.serviceName,
        description: s.description || '',
        quantity: s.quantity || 1,
      })) : [],
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setShowModal(true);
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    setForm({
      ...form,
      services: [
        ...form.services,
        {
          serviceName: newServiceName.trim(),
          description: newServiceDesc.trim() || undefined,
          quantity: 1,
        },
      ],
    });
    setNewServiceName('');
    setNewServiceDesc('');
  };

  const handleRemoveService = (index: number) => {
    setForm({
      ...form,
      services: form.services.filter((_, i) => i !== index),
    });
  };

  const generateShareText = (pkg: any, cName?: string) => {
    if (!pkg) return '';
    const greeting = cName?.trim() ? `Hello ${cName.trim()},\n\n` : 'Hello,\n\n';
    let text = `${greeting}Here are the details for our *${pkg.name}*:\n\n`;
    text += `💰 *Starting Price*: ${formatCurrency(Number(pkg.basePrice))}\n`;
    if (pkg.duration) text += `⏱ *Duration*: ${pkg.duration}\n`;
    if (pkg.description) text += `📝 *Overview*: ${pkg.description}\n`;
    text += `\n✨ *Included In Package*:\n`;
    if (pkg.services && pkg.services.length > 0) {
      pkg.services.forEach((s: any) => {
        text += `• *${s.serviceName}*${s.description ? ` (${s.description})` : ''}\n`;
      });
    } else {
      text += `• Professional photo & video coverage with full resolution delivery\n`;
    }
    text += `\nLooking forward to creating memorable moments with you!\n— *Photo Fashion Studio*`;
    return text;
  };

  const handleShareWhatsApp = (pkg: any) => {
    const text = generateShareText(pkg, shareClientName);
    const clean = shareClientPhone.replace(/\D/g, '');
    let url = '';
    if (clean.length >= 10) {
      const full = clean.length === 10 ? `91${clean}` : clean;
      url = `https://api.whatsapp.com/send?phone=${full}&text=${encodeURIComponent(text)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyDetails = (pkg: any) => {
    const text = generateShareText(pkg, shareClientName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Package proposal copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openShareModal = async (pkg: any) => {
    setSharingPackage(pkg);
    setShareClientName('');
    setShareClientPhone('');
    setSelectedCustomerId('');
    setSelectedProjectId('');
    setShareNotes('');
    setCopied(false);
    setExistingShares([]);

    try {
      const [custRes, prjRes, sharesRes] = await Promise.all([
        customerApi.getAll(),
        projectApi.getAll({ type: pkg.domain }),
        packageApi.getShares(pkg.id),
      ]);
      setClients(custRes.data.data || []);
      setProjects(prjRes.data.data || []);
      setExistingShares(sharesRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveShare = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a client to share with');
      return;
    }
    setIsSavingShare(true);
    try {
      await packageApi.share(sharingPackage.id, {
        customerId: selectedCustomerId,
        projectId: selectedProjectId || undefined,
        notes: shareNotes || undefined,
      });
      toast.success('Package shared with client successfully!');
      const sharesRes = await packageApi.getShares(sharingPackage.id);
      setExistingShares(sharesRes.data.data || []);
      const selectedClient = clients.find((c) => c.id === selectedCustomerId);
      if (selectedClient) {
        if (selectedClient.fullName) setShareClientName(selectedClient.fullName);
        if (selectedClient.phone) setShareClientPhone(selectedClient.phone);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to share package');
    } finally {
      setIsSavingShare(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.basePrice);
    if (!form.name.trim()) {
      toast.error('Please enter a package name');
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        domain: form.domain,
        basePrice: price,
        duration: form.duration.trim() || null,
        description: form.description.trim() || null,
        services: form.services,
      };

      if (editingPackage) {
        await packageApi.update(editingPackage.id, payload);
        toast.success(`Package "${payload.name}" updated successfully`);
      } else {
        await packageApi.create(payload);
        toast.success(`Package "${payload.name}" created successfully`);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save package');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete package "${name}"?`)) return;
    try {
      await packageApi.delete(id);
      toast.success(`Package "${name}" deleted`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete package');
    }
  };

  const pageTitle = defaultDomain === 'WEDDING' ? 'Wedding Shoot Packages' : defaultDomain === 'FASHION' ? 'Studio Fashion Packages' : 'Packages';
  const pageSub = defaultDomain === 'WEDDING' ? 'Standardized pricing, services & deliverable tiers for wedding shoots' : 'Pre-configured studio photography & video packages';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pageSub}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-sm font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {!defaultDomain && (
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Packages' },
              { id: 'WEDDING', label: 'Wedding Shoot' },
              { id: 'FASHION', label: 'Studio Fashion' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages or services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27]"
          />
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
        </div>
      ) : packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#C59B27] flex items-center justify-center flex-shrink-0 border border-amber-100">
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#C59B27] transition-colors">
                        {pkg.name}
                      </h3>
                      {pkg.duration && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{pkg.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#9A7318] border border-amber-200/60 uppercase tracking-wider">
                    {pkg.domain}
                  </span>
                </div>

                {/* Price */}
                <div className="my-4 pb-4 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Starting Package Price</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight mt-0.5 text-[#9A7318]">
                    {formatCurrency(Number(pkg.basePrice))}
                  </p>
                  {pkg.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  )}
                </div>

                {/* Services List */}
                <div className="space-y-2 mb-4">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Included In Package</p>
                  {pkg.services && pkg.services.length > 0 ? (
                    pkg.services.map((s: any, idx: number) => (
                      <div key={s.id || idx} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-800">{s.serviceName}</span>
                          {s.description && (
                            <span className="text-gray-400 text-[11px]"> &bull; {s.description}</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No specific service breakdown</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => openShareModal(pkg)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200/70 transition-all cursor-pointer shadow-xs"
                  title="Share package with client"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share with Client</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit package"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id, pkg.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No Packages Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Create standard service packages with pricing, durations, and included photography/cinematography services.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Package
          </button>
        </div>
      )}

      {/* Modal: Create / Edit Package */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPackage ? `Edit Package: ${editingPackage.name}` : 'Create New Package'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Package Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Royal Cinematic Wedding Package"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Domain</label>
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white font-medium"
              >
                <option value="WEDDING">Wedding Shoot</option>
                <option value="FASHION">Studio Fashion</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price (₹) *</label>
              <input
                required
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 150000"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration / Coverage</label>
              <input
                type="text"
                placeholder="e.g. 2 Days (Sangeet & Wedding)"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Package Description</label>
            <textarea
              rows={2}
              placeholder="Summary of what this package covers..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>

          {/* Included Services Section */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Services & Deliverables Included ({form.services.length})
              </label>
            </div>

            {/* Current services */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {form.services.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{s.serviceName}</span>
                      {s.description && (
                        <span className="text-gray-400 text-[11px] ml-1.5">&bull; {s.description}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(idx)}
                    className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add service inline input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-gray-200">
              <input
                type="text"
                placeholder="Service name (e.g. Drone Shoot)"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
              <input
                type="text"
                placeholder="Description / note (optional)"
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-all"
              >
                + Add Service
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
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
              {submitting ? 'Saving...' : editingPackage ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Share Package with Client */}
      <Modal
        isOpen={Boolean(sharingPackage)}
        onClose={() => setSharingPackage(null)}
        title={sharingPackage ? `Share Package: ${sharingPackage.name}` : 'Share Package'}
        size="md"
      >
        {sharingPackage && (
          <div className="space-y-4">
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">{sharingPackage.domain} PACKAGE</p>
                <h4 className="text-base font-bold text-gray-900 mt-0.5">{sharingPackage.name}</h4>
                <p className="text-xl font-black text-[#9A7318] mt-1">{formatCurrency(Number(sharingPackage.basePrice))}</p>
              </div>
              {sharingPackage.duration && (
                <span className="text-xs bg-white px-2.5 py-1 rounded-lg border border-amber-200 text-gray-700 font-semibold shadow-xs">
                  {sharingPackage.duration}
                </span>
              )}
            </div>

            {/* DB-Backed Share with Client Form */}
            <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 space-y-3">
              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#C59B27]" />
                Share with Client & Project (Save to CRM)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Client *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setSelectedCustomerId(cId);
                      const c = clients.find((item) => item.id === cId);
                      if (c) {
                        setShareClientName(c.fullName || '');
                        setShareClientPhone(c.phone || '');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Project (Optional)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                  >
                    <option value="">-- Direct Client / No Project --</option>
                    {projects
                      .filter((p) => !selectedCustomerId || p.customerId === selectedCustomerId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Terms (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Valid until next Sunday, includes 10% advance discount"
                  value={shareNotes}
                  onChange={(e) => setShareNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={!selectedCustomerId || isSavingShare}
                  onClick={handleSaveShare}
                  className="px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingShare ? 'Saving Relationship...' : 'Save & Share with Client'}</span>
                </button>
              </div>
            </div>

            {/* Currently Shared Clients List */}
            {existingShares.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Currently Shared With ({existingShares.length} Clients)
                </p>
                <div className="divide-y divide-gray-100 max-h-36 overflow-y-auto">
                  {existingShares.map((sh) => (
                    <div key={sh.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-900">{sh.customer?.fullName || 'Client'}</span>
                        {sh.project?.name && (
                          <span className="text-gray-500 ml-2 font-medium">({sh.project.name})</span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-2">Shared on {formatDate(sh.sharedAt)}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {sh.status || 'SHARED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp / Quick Copy details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aditi & Rahul"
                  value={shareClientName}
                  onChange={(e) => setShareClientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 text-xs bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-gray-500 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="10-digit phone"
                    value={shareClientPhone}
                    onChange={(e) => setShareClientPhone(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-r-lg outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Proposal Preview</label>
                <button
                  type="button"
                  onClick={() => handleCopyDetails(sharingPackage)}
                  className="text-xs text-[#9A7318] hover:text-[#7A5B12] font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Preview'}</span>
                </button>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 whitespace-pre-line font-mono max-h-36 overflow-y-auto leading-relaxed custom-scrollbar">
                {generateShareText(sharingPackage, shareClientName)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSharingPackage(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleCopyDetails(sharingPackage)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Details' : 'Copy Proposal'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(sharingPackage)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
