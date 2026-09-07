import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Heart, Shirt, Calendar, IndianRupee, Trash2, Edit2, Camera, Eye, CreditCard } from 'lucide-react';
import { projectApi, customerApi, paymentApi, formatCurrency, formatDate } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function AllProjectsPage({ defaultType }: { defaultType?: 'WEDDING' | 'FASHION' }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'WEDDING' | 'FASHION'>(defaultType || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    paymentType: 'ADVANCE',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });

  const openPaymentModal = (p: any) => {
    setSelectedProject(p);
    setPaymentForm({
      amount: '',
      paymentMethod: 'UPI',
      paymentType: (p.totalPaid || 0) > 0 ? 'INSTALLMENT' : 'ADVANCE',
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
      toast.error('Please enter a valid payment amount greater than ₹0');
      return;
    }
    setPaymentSubmitting(true);
    try {
      await paymentApi.create({
        customerId: selectedProject.customer?.id || selectedProject.customerId,
        projectId: selectedProject.id,
        amount: amt,
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} recorded successfully!`);
      setShowPaymentModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Form State
  const [projectType, setProjectType] = useState<'WEDDING' | 'FASHION'>(defaultType || 'WEDDING');
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [notes, setNotes] = useState('');

  // Wedding fields
  const [weddingDate, setWeddingDate] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [functions, setFunctions] = useState('');

  // Fashion fields
  const [brand, setBrand] = useState('');
  const [shootType, setShootType] = useState('Campaign');
  const [studioLocation, setStudioLocation] = useState('Main Studio Bay A');
  const [creativeTeam, setCreativeTeam] = useState('');
  const [modelsInfo, setModelsInfo] = useState('');
  const [garmentsInfo, setGarmentsInfo] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        projectApi.getAll({
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search || undefined,
        }),
        customerApi.getAll(),
      ]);
      setProjects(pRes.data.data);
      setCustomers(cRes.data.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, search]);

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectType(defaultType || 'WEDDING');
    setName('');
    setCustomerId(customers[0]?.id || '');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setBudget('');
    setStatus('PLANNING');
    setNotes('');
    setWeddingDate(new Date().toISOString().split('T')[0]);
    setVenue('');
    setCity('');
    setFunctions('Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception');
    setBrand('');
    setShootType('Campaign');
    setStudioLocation('Studio Bay A - White Cyclorama');
    setCreativeTeam('Lead Fashion Photographer, Stylist, MUA');
    setModelsInfo('');
    setGarmentsInfo('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setProjectType(p.projectType);
    setName(p.name);
    setCustomerId(p.customerId);
    setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setEndDate(p.endDate ? p.endDate.split('T')[0] : '');
    setBudget(String(p.budget || ''));
    setStatus(p.status || 'PLANNING');
    setNotes(p.notes || '');
    setWeddingDate(p.weddingDate ? p.weddingDate.split('T')[0] : '');
    setVenue(p.venue || '');
    setCity(p.city || '');
    setFunctions(p.functions || '');
    setBrand(p.brand || '');
    setShootType(p.shootType || 'Campaign');
    setStudioLocation(p.studioLocation || '');
    setCreativeTeam(p.creativeTeam || '');
    setModelsInfo(p.modelsInfo || '');
    setGarmentsInfo(p.garmentsInfo || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !customerId || !startDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      name,
      projectType,
      customerId,
      startDate,
      endDate: endDate || null,
      budget: Number(budget) || 0,
      status,
      notes,
      weddingDate: projectType === 'WEDDING' ? (weddingDate || startDate) : null,
      venue: projectType === 'WEDDING' ? venue : null,
      city: projectType === 'WEDDING' ? city : null,
      functions: projectType === 'WEDDING' ? functions : null,
      brand: projectType === 'FASHION' ? brand : null,
      shootType: projectType === 'FASHION' ? shootType : null,
      studioLocation: projectType === 'FASHION' ? studioLocation : null,
      creativeTeam: projectType === 'FASHION' ? creativeTeam : null,
      modelsInfo: projectType === 'FASHION' ? modelsInfo : null,
      garmentsInfo: projectType === 'FASHION' ? garmentsInfo : null,
    };

    try {
      if (editingProject) {
        await projectApi.update(editingProject.id, payload);
        toast.success('Project updated successfully');
      } else {
        await projectApi.create(payload);
        toast.success('Project created successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving project');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      await projectApi.delete(id);
      toast.success('Project deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  // Calculations
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalPaid = projects.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0);
  const totalRemaining = projects.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {defaultType === 'WEDDING'
              ? 'Wedding Shoot Projects'
              : defaultType === 'FASHION'
              ? 'Studio Fashion Projects'
              : 'All Projects'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {defaultType === 'WEDDING'
              ? 'Manage wedding ceremonies, shoots, and event timelines'
              : defaultType === 'FASHION'
              ? 'Manage fashion lookbooks, campaigns, and commercial shoots'
              : 'Unified view across Wedding Shoot and Studio Fashion operations'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          {defaultType === 'WEDDING' ? 'New Wedding Project' : defaultType === 'FASHION' ? 'New Fashion Project' : 'New Project'}
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Total Projects</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase">Total Budget</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
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

      {/* Filters & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        {/* Domain Filter (if not locked to defaultType) */}
        {!defaultType && (
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
            <span className="text-xs font-semibold text-gray-400 uppercase mr-2">Domain:</span>
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'WEDDING', label: 'Wedding Shoot' },
              { id: 'FASHION', label: 'Studio Fashion' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === tab.id
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
            {['ALL', 'PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'EDITING', 'COMPLETED', 'CANCELLED'].map((st) => (
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
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] focus:ring-1 focus:ring-[#C59B27]"
            />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Budget</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Remaining</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{p.projectNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 ${
                          p.projectType === 'WEDDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                        }`}
                      >
                        {p.projectType === 'WEDDING' ? (
                          <>
                            <Heart className="w-3 h-3 text-amber-600" /> Wedding Shoot
                          </>
                        ) : (
                          <>
                            <Shirt className="w-3 h-3 text-purple-600" /> Studio Fashion
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800">{p.customer?.fullName || '-'}</div>
                      {p.brand && <div className="text-xs text-purple-600 font-medium">{p.brand}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {formatDate(p.startDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(p.budget)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(p.totalPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                      {formatCurrency(p.remainingAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openPaymentModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all shadow-xs"
                          title="Record payment received for this project"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          + Payment
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
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
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No projects found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search ? 'No projects match your search query.' : 'Click "New Project" to register your first project.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Project Type (only on create) */}
          {!editingProject && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Select Business Domain / Project Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProjectType('WEDDING')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    projectType === 'WEDDING'
                      ? 'border-amber-400 bg-amber-50/60 text-amber-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Wedding Shoot</p>
                    <p className="text-[10px] text-gray-500">Ceremonies & Films</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectType('FASHION')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    projectType === 'FASHION'
                      ? 'border-purple-400 bg-purple-50/60 text-purple-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shirt className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Studio Fashion</p>
                    <p className="text-[10px] text-gray-500">Lookbooks & Models</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={projectType === 'WEDDING' ? 'e.g. Aryan & Meera Royal Wedding' : 'e.g. Vogue Summer Lookbook 2026'}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Client *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
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
          </div>

          {/* Domain Specific Fields */}
          {projectType === 'WEDDING' ? (
            <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/50 space-y-3">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Wedding Shoot Details</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Wedding Date</label>
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. The Taj Palace"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Udaipur / Chandigarh"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Ceremonies / Functions</label>
                <input
                  type="text"
                  value={functions}
                  onChange={(e) => setFunctions(e.target.value)}
                  placeholder="Haldi, Mehendi, Sangeet, Wedding, Reception"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-200/50 space-y-3">
              <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">Studio Fashion Details</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Brand / Label</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Zara / Sabyasachi"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Shoot Type</label>
                  <select
                    value={shootType}
                    onChange={(e) => setShootType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    <option value="Lookbook">Lookbook</option>
                    <option value="Campaign">Campaign</option>
                    <option value="E-commerce Catalog">E-commerce Catalog</option>
                    <option value="Editorial">Editorial</option>
                    <option value="Product Shoot">Product Shoot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Studio Bay / Location</label>
                  <input
                    type="text"
                    value={studioLocation}
                    onChange={(e) => setStudioLocation(e.target.value)}
                    placeholder="Studio Bay A / Outdoor"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Assigned Models</label>
                  <input
                    type="text"
                    value={modelsInfo}
                    onChange={(e) => setModelsInfo(e.target.value)}
                    placeholder="e.g. Elena R., Kabir M."
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">Garments / Styling</label>
                  <input
                    type="text"
                    value={garmentsInfo}
                    onChange={(e) => setGarmentsInfo(e.target.value)}
                    placeholder="e.g. 15 Outfits, Silk Velvet line"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Budget, Dates, Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Budget (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="250000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
              >
                <option value="PLANNING">Planning</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="EDITING">Editing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special client requirements, mood board links, creative notes..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
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
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      {selectedProject && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Record Payment — ${selectedProject.name}`}
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900">{selectedProject.name}</p>
                <p className="text-[11px] text-gray-500">
                  Client: {selectedProject.customer?.fullName || 'Client'} &bull; Budget: {formatCurrency(selectedProject.budget || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Remaining Due</p>
                <p className="text-sm font-bold text-amber-600">
                  {formatCurrency(selectedProject.remainingAmount ?? (selectedProject.budget || 0))}
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
                placeholder="e.g. Advance paid for wedding shoot"
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
