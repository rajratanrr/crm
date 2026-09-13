import { useEffect, useState } from 'react';
import {
  Plus, Search, Shirt, ChevronRight, X, Trash2, Edit2,
  IndianRupee, Calendar, Link2, MapPin, Film, PackagePlus,
  UserCircle, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import {
  projectApi, customerApi, paymentApi, modelApi,
  fashionApi, formatCurrency, formatDate,
} from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

// ─── Constants ──────────────────────────────────────────────────────────────
const PROJECT_STATUS = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
const STUDIO_LOCATIONS = [
  'Ground Floor Bay',
  'Second Floor Bay',
  'Meraki Studio',
  'Outdoor Location',
  'Client Location',
  'Other',
];
const SHOOT_TYPES = [
  { value: 'PHOTO', label: 'Photo Only' },
  { value: 'PHOTO_VIDEO', label: 'Photo + Video' },
  { value: 'VIDEO', label: 'Video Only' },
  { value: 'UGC_CREATIVE', label: 'UGC / Creative' },
];
const CLOTH_TYPES = ['Saree', 'Kurti', 'Bottom', 'Shirt', 'Lehenga', 'Sherwani', 'Western', 'Fusion', 'Accessories', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface GarmentRow { id?: string; clothType: string; dressName: string; quantity: number; }
interface ModelAssignment { id?: string; modelId: string; modelRate: number; notes: string; model?: any; }

function emptyProject() {
  return {
    name: '',
    customerId: '',
    status: 'PLANNING',
    budget: '',       // contractAmount (client-facing)
    baseBudget: '',   // internal production budget
    shootDate: '',
    studioLocation: '',
    shootType: '',
    driveLink: '',
    notes: '',
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FashionProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create / Edit project modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectForm, setProjectForm] = useState(emptyProject());
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedClientData, setSelectedClientData] = useState<any>(null);
  const [modalModelAssignments, setModalModelAssignments] = useState<ModelAssignment[]>([]);
  const [formSaving, setFormSaving] = useState(false);

  // Garment requirements (inline in detail panel)
  const [garments, setGarments] = useState<GarmentRow[]>([]);
  const [garmentSaving, setGarmentSaving] = useState(false);

  // Model assignments (inline in detail panel)
  const [modelAssignments, setModelAssignments] = useState<ModelAssignment[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [modelSaving, setModelSaving] = useState(false);

  // Quick payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'UPI', paymentStatus: 'ADVANCE', notes: '' });
  const [paySaving, setPaySaving] = useState(false);

  // ─── Loaders ────────────────────────────────────────────────────────────────
  const loadProjects = async () => {
    setLoading(true);
    try {
      const [projRes, custRes, modsRes] = await Promise.all([
        projectApi.getAll({ type: 'FASHION', search: search || undefined }),
        customerApi.getAll({ clientType: 'FASHION' }),
        modelApi.getAll(),
      ]);
      setProjects(projRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setAllModels(modsRes.data.data || []);
    } catch {
      toast.error('Failed to load Fashion projects');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const [projRes, garReqs, modAssigns, modsRes] = await Promise.all([
        projectApi.getOne(id),
        projectApi.getGarments(id),           // /api/projects/:id/garments
        projectApi.getModels(id),             // /api/projects/:id/models
        modelApi.getAll(),
      ]);
      setSelectedProject(projRes.data.data);
      setGarments(garReqs.data.data.map((g: any) => ({
        id: g.id, clothType: g.clothType, dressName: g.dressName, quantity: g.quantity,
      })));
      setModelAssignments(modAssigns.data.data.map((a: any) => ({
        id: a.id, modelId: a.modelId, modelRate: Number(a.modelRate), notes: a.notes || '', model: a.model,
      })));
      setAllModels(modsRes.data.data);
    } catch {
      toast.error('Failed to load project details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, [search]);

  // ─── Project CRUD ────────────────────────────────────────────────────────────
  const openCreateModal = async () => {
    setEditingProject(null);
    setProjectForm(emptyProject());
    setSelectedClientData(null);
    setModalModelAssignments([]);
    if (customers.length === 0) {
      try {
        const { data } = await customerApi.getAll({ clientType: 'FASHION' });
        setCustomers(data.data || []);
      } catch {}
    }
    if (allModels.length === 0) {
      try {
        const { data } = await modelApi.getAll();
        setAllModels(data.data || []);
      } catch {}
    }
    setIsProjectModalOpen(true);
  };

  const openEditModal = async (p: any) => {
    setEditingProject(p);
    setProjectForm({
      name: p.name || '',
      customerId: p.customerId || '',
      status: p.status || 'PLANNING',
      budget: p.budget ? String(p.budget) : '',
      baseBudget: p.baseBudget ? String(p.baseBudget) : '',
      shootDate: p.shootDate ? p.shootDate.split('T')[0] : '',
      studioLocation: p.studioLocation || '',
      shootType: p.shootType || '',
      driveLink: p.driveLink || '',
      notes: p.notes || '',
    });

    const foundCust = customers.find((c) => c.id === p.customerId) || p.customer;
    setSelectedClientData(foundCust || null);

    try {
      const { data } = await projectApi.getModels(p.id);
      setModalModelAssignments(
        (data.data || []).map((a: any) => ({
          id: a.id,
          modelId: a.modelId,
          modelRate: Number(a.modelRate) || 0,
          notes: a.notes || '',
          model: a.model,
        }))
      );
    } catch {
      setModalModelAssignments([]);
    }

    if (customers.length === 0) {
      try {
        const { data } = await customerApi.getAll({ clientType: 'FASHION' });
        setCustomers(data.data || []);
      } catch {}
    }
    if (allModels.length === 0) {
      try {
        const { data } = await modelApi.getAll();
        setAllModels(data.data || []);
      } catch {}
    }
    setIsProjectModalOpen(true);
  };

  const handleClientSelect = async (customerId: string) => {
    setProjectForm((prev) => ({ ...prev, customerId }));
    if (!customerId) {
      setSelectedClientData(null);
      setModalModelAssignments([]);
      return;
    }

    let client = customers.find((c) => c.id === customerId);
    if (!client || !client.fashionClientModels) {
      try {
        const { data } = await customerApi.getOne(customerId);
        client = data.data;
      } catch {}
    }
    setSelectedClientData(client || null);

    // Auto-prefill project name if currently empty
    if (!projectForm.name && client) {
      const brandOrName = client.companyName || client.fullName;
      setProjectForm((prev) => ({ ...prev, name: `${brandOrName} Campaign` }));
    }

    // Auto-load client default models and agreed rates from backend
    if (client?.fashionClientModels && client.fashionClientModels.length > 0) {
      const assigns: ModelAssignment[] = client.fashionClientModels.map((cm: any) => ({
        modelId: cm.modelId,
        modelRate: Number(cm.defaultRate) || 0,
        notes: cm.notes || '',
        model: cm.model || allModels.find((m) => m.id === cm.modelId),
      }));
      setModalModelAssignments(assigns);
    } else {
      try {
        const { data } = await fashionApi.getClientModels(customerId);
        const assigns: ModelAssignment[] = (data.data || []).map((cm: any) => ({
          modelId: cm.modelId,
          modelRate: Number(cm.defaultRate) || 0,
          notes: cm.notes || '',
          model: cm.model || allModels.find((m) => m.id === cm.modelId),
        }));
        setModalModelAssignments(assigns);
      } catch {
        setModalModelAssignments([]);
      }
    }
  };


  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name || !projectForm.customerId) {
      toast.error('Project name and client are required');
      return;
    }
    setFormSaving(true);
    try {
      const payload = {
        ...projectForm,
        projectType: 'FASHION',
        budget: Number(projectForm.budget) || 0,           // contractAmount
        baseBudget: Number((projectForm as any).baseBudget) || 0,
        endDate: null,
        modelAssignments: modalModelAssignments.map((a) => ({
          modelId: a.modelId,
          modelRate: Number(a.modelRate) || 0,
          notes: a.notes || '',
        })),
      };
      if (editingProject) {
        await projectApi.update(editingProject.id, payload);
        toast.success('Project updated');
      } else {
        await projectApi.create(payload);
        toast.success('Fashion project created');
      }
      setIsProjectModalOpen(false);
      loadProjects();
      if (selectedProject && editingProject?.id === selectedProject.id) {
        loadDetail(editingProject.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving project');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await projectApi.delete(id);
      toast.success('Project deleted');
      if (selectedProject?.id === id) setSelectedProject(null);
      loadProjects();
    } catch { toast.error('Failed to delete project'); }
  };

  // ─── Garment Requirements ────────────────────────────────────────────────────
  const addGarmentRow = () => {
    setGarments((prev) => [...prev, { clothType: CLOTH_TYPES[0], dressName: '', quantity: 1 }]);
  };

  const updateGarmentRow = (idx: number, field: keyof GarmentRow, value: any) => {
    setGarments((prev) => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  const removeGarmentRow = async (idx: number) => {
    const row = garments[idx];
    if (row.id) {
      try { await fashionApi.deleteGarmentRequirement(row.id); } catch {}
    }
    setGarments((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveGarments = async () => {
    if (!selectedProject) return;
    setGarmentSaving(true);
    try {
      await projectApi.bulkGarments(selectedProject.id, garments.map(g => ({
        clothType: g.clothType, dressName: g.dressName, quantity: g.quantity,
      })));
      toast.success('Garment requirements saved');
      loadDetail(selectedProject.id);
    } catch { toast.error('Failed to save garment requirements'); }
    finally { setGarmentSaving(false); }
  };

  // ─── Model Assignments ───────────────────────────────────────────────────────
  const addModelAssignment = () => {
    if (allModels.length === 0) { toast.error('No models in roster. Add models first.'); return; }
    const used = modelAssignments.map(a => a.modelId);
    const available = allModels.filter(m => !used.includes(m.id));
    if (available.length === 0) { toast.error('All models are already assigned'); return; }
    setModelAssignments(prev => [...prev, { modelId: available[0].id, modelRate: 0, notes: '' }]);
  };

  const updateModelAssignment = (idx: number, field: keyof ModelAssignment, value: any) => {
    setModelAssignments(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const removeModelAssignment = async (idx: number) => {
    const row = modelAssignments[idx];
    if (row.id) {
      try { await projectApi.removeModel(selectedProject!.id, row.id); toast.success('Model removed'); } catch {}
    }
    setModelAssignments(prev => prev.filter((_, i) => i !== idx));
  };

  const saveModelAssignments = async () => {
    if (!selectedProject) return;
    setModelSaving(true);
    try {
      for (const assignment of modelAssignments) {
        // Uses upsert — safe to call for both new and existing
        await projectApi.addModel(selectedProject.id, {
          modelId: assignment.modelId,
          modelRate: Number(assignment.modelRate) || 0,
          notes: assignment.notes,
        });
      }
      toast.success('Model assignments saved');
      loadDetail(selectedProject.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save model assignments');
    } finally { setModelSaving(false); }
  };

  // ─── Quick Payment ────────────────────────────────────────────────────────────
  const openPayModal = () => {
    setPayForm({ amount: '', paymentMethod: 'UPI', paymentStatus: 'ADVANCE', notes: '' });
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setPaySaving(true);
    try {
      await paymentApi.create({
        customerId: selectedProject.customerId,
        projectId: selectedProject.id,
        domain: 'FASHION',
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        paymentType: 'ADVANCE',
        paymentStatus: payForm.paymentStatus,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: payForm.notes,
      });
      toast.success('Payment recorded');
      setIsPayModalOpen(false);
      loadDetail(selectedProject.id);
      loadProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally { setPaySaving(false); }
  };

  // ─── Modal Calculations ───────────────────────────────────────────────────────
  const modalTotalModelCost = modalModelAssignments.reduce((s, a) => s + (Number(a.modelRate) || 0), 0);
  const modalBaseBudget = Number((projectForm as any).baseBudget) || 0;
  const modalTotalBudget = modalBaseBudget + modalTotalModelCost;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* Left Panel — Project List */}
      <div className={`flex flex-col bg-white border-r border-gray-100 transition-all duration-200 ${selectedProject ? 'w-[380px] flex-shrink-0' : 'flex-1'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Fashion Projects</h1>
            <p className="text-xs text-gray-500">Studio Fashion lookbooks & campaigns</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Project
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-50">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text" placeholder="Search projects..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs outline-none w-full"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-2 border-[#C59B27]/30 border-t-[#C59B27] rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Shirt className="w-10 h-10 mx-auto mb-3 text-purple-300" />
              <p className="font-semibold text-gray-700">No fashion projects yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first lookbook or campaign project.</p>
              <button onClick={openCreateModal} className="mt-4 px-4 py-2 bg-[#C59B27] text-white text-xs font-semibold rounded-xl">
                Create First Project
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {projects.map((p) => {
                const paid = Number(p.totalPaid) || 0;
                const budget = Number(p.budget) || 0;
                const pct = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0;
                const isSelected = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProject(null); loadDetail(p.id); }}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50/80 ${isSelected ? 'bg-purple-50/60 border-l-2 border-purple-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900 truncate">{p.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${STATUS_COLORS[p.status] || STATUS_COLORS.PLANNING}`}>
                            {p.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{p.customer?.fullName}</p>
                        {p.shootDate && (
                          <p className="text-[11px] text-purple-600 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(p.shootDate)}
                          </p>
                        )}
                        {budget > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                              <span>{formatCurrency(paid)} paid</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full">
                              <div className="h-1 bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(p); }} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, p.name); }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

      {/* Right Panel — Project Detail */}
      {selectedProject !== null && (
        <div className="flex-1 overflow-y-auto bg-gray-50/40">
          {detailLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
            </div>
          ) : selectedProject && (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              {/* Detail Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase ${STATUS_COLORS[selectedProject.status] || STATUS_COLORS.PLANNING}`}>
                      {selectedProject.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedProject.projectNumber} · {selectedProject.customer?.fullName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEditModal(selectedProject)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedProject(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedProject.shootDate && (
                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <Calendar className="w-3 h-3" /> Shoot Date
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedProject.shootDate)}</p>
                  </div>
                )}
                {selectedProject.studioLocation && (
                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <MapPin className="w-3 h-3" /> Location
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{selectedProject.studioLocation}</p>
                  </div>
                )}
                {selectedProject.shootType && (
                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <Film className="w-3 h-3" /> Shoot Type
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {SHOOT_TYPES.find(t => t.value === selectedProject.shootType)?.label || selectedProject.shootType}
                    </p>
                  </div>
                )}
                {selectedProject.driveLink && (
                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <Link2 className="w-3 h-3" /> Drive Link
                    </div>
                    <a href={selectedProject.driveLink} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-purple-600 hover:underline break-all">
                      Open Drive ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Financial Summary — 6 metrics */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#C59B27]" /> Financial Summary
                  </h3>
                  <button onClick={openPayModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-lg transition-all">
                    <Plus className="w-3.5 h-3.5" /> Record Payment
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Base Budget</p>
                    <p className="text-base font-bold text-gray-700 mt-1">{formatCurrency(selectedProject.baseBudget || 0)}</p>
                    <p className="text-[10px] text-gray-400">Internal production</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Model Cost</p>
                    <p className="text-base font-bold text-purple-600 mt-1">{formatCurrency(selectedProject.totalModelCost || 0)}</p>
                    <p className="text-[10px] text-gray-400">{modelAssignments.length} model{modelAssignments.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Budget</p>
                    <p className="text-base font-bold text-indigo-700 mt-1">{formatCurrency((selectedProject.baseBudget || 0) + (selectedProject.totalModelCost || 0))}</p>
                    <p className="text-[10px] text-indigo-400">Base + Models</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contract Amount</p>
                    <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(selectedProject.budget)}</p>
                    <p className="text-[10px] text-gray-400">Client-facing</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Received</p>
                    <p className="text-base font-bold text-emerald-600 mt-1">{formatCurrency(selectedProject.totalPaid || 0)}</p>
                    <p className="text-[10px] text-emerald-400">ADVANCE + DONE</p>
                  </div>
                  <div className={`text-center p-3 rounded-xl ${(selectedProject.remainingAmount || 0) > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Balance</p>
                    <p className={`text-base font-bold mt-1 ${(selectedProject.remainingAmount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatCurrency(selectedProject.remainingAmount || 0)}
                    </p>
                    <p className="text-[10px] text-gray-400">Not yet received</p>
                  </div>
                </div>
                {/* Progress bar */}
                {Number(selectedProject.budget) > 0 && (
                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((Number(selectedProject.totalPaid) / Number(selectedProject.budget)) * 100))}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                      {Math.min(100, Math.round((Number(selectedProject.totalPaid) / Number(selectedProject.budget)) * 100))}% of contract collected
                    </p>
                  </div>
                )}
                {/* Payment history */}
                {selectedProject.payments?.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {selectedProject.payments.map((pay: any) => {
                      const st = pay.paymentStatus || 'ADVANCE';
                      const stColors: Record<string, string> = {
                        ADVANCE: 'bg-blue-50 text-blue-700',
                        PENDING: 'bg-amber-50 text-amber-700',
                        DONE: 'bg-emerald-50 text-emerald-700',
                      };
                      return (
                        <div key={pay.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${stColors[st]}`}>{st}</span>
                            <span className="text-gray-600">{pay.paymentMethod?.replace(/_/g, ' ')}</span>
                            <span className="text-gray-400">{formatDate(pay.paymentDate)}</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatCurrency(pay.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-3">No payments recorded yet.</p>
                )}
              </div>

              {/* Garment Requirements */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <PackagePlus className="w-4 h-4 text-purple-600" /> Garment Requirements
                  </h3>
                  <button onClick={addGarmentRow} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
                {garments.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No garments listed yet. Add rows to specify cloth types and quantities.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_2fr_80px_36px] gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
                      <span>Cloth Type</span><span>Dress / Item Name</span><span>Qty</span><span />
                    </div>
                    {garments.map((g, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_2fr_80px_36px] gap-2 items-center">
                        <select
                          value={g.clothType}
                          onChange={(e) => updateGarmentRow(idx, 'clothType', e.target.value)}
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-purple-400"
                        >
                          {CLOTH_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="text" value={g.dressName}
                          onChange={(e) => updateGarmentRow(idx, 'dressName', e.target.value)}
                          placeholder="e.g. Banarasi Silk Saree"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-purple-400"
                        />
                        <input
                          type="number" min={0} value={g.quantity}
                          onChange={(e) => updateGarmentRow(idx, 'quantity', parseInt(e.target.value) || 0)}
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-purple-400"
                        />
                        <button onClick={() => removeGarmentRow(idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {garments.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={saveGarments} disabled={garmentSaving} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60">
                      {garmentSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Save Garments
                    </button>
                  </div>
                )}
              </div>

              {/* Model Assignments */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-purple-600" /> Assigned Models
                    {selectedProject.totalModelCost > 0 && (
                      <span className="text-xs text-gray-500 font-normal">· Total: {formatCurrency(selectedProject.totalModelCost)}</span>
                    )}
                  </h3>
                  <button onClick={addModelAssignment} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Assign Model
                  </button>
                </div>
                {modelAssignments.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No models assigned. Add models from the roster and set per-project rates.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[2fr_120px_1fr_36px] gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">
                      <span>Model</span><span>Rate (₹/shoot)</span><span>Notes</span><span />
                    </div>
                    {modelAssignments.map((a, idx) => (
                      <div key={idx} className="grid grid-cols-[2fr_120px_1fr_36px] gap-2 items-center">
                        <select
                          value={a.modelId}
                          onChange={(e) => updateModelAssignment(idx, 'modelId', e.target.value)}
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-purple-400"
                        >
                          {allModels.map(m => <option key={m.id} value={m.id}>{m.name} {m.gender ? `(${m.gender})` : ''}</option>)}
                        </select>
                        <input
                          type="number" min={0} value={a.modelRate}
                          onChange={(e) => updateModelAssignment(idx, 'modelRate', parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 15000"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-purple-400"
                        />
                        <input
                          type="text" value={a.notes}
                          onChange={(e) => updateModelAssignment(idx, 'notes', e.target.value)}
                          placeholder="Optional notes"
                          className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-purple-400"
                        />
                        <button onClick={() => removeModelAssignment(idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {modelAssignments.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={saveModelAssignments} disabled={modelSaving} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60">
                      {modelSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Save Assignments
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedProject.notes && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" /> Notes
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedProject.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProject ? `Edit — ${editingProject.name}` : 'New Fashion Project'}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text" required value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="e.g. Banarasi Collection Lookbook 2026"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fashion Client *</label>
              <select
                required
                value={projectForm.customerId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">— Select Client —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.companyName ? `(${c.companyName})` : c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Client Information Banner */}
            {selectedClientData && (
              <div className="md:col-span-2 bg-purple-50/60 border border-purple-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-purple-900">
                    {selectedClientData.companyName
                      ? `${selectedClientData.companyName} (${selectedClientData.fullName})`
                      : selectedClientData.fullName}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-gray-500 text-[11px] mt-0.5">
                    {selectedClientData.phone && <span>📞 {selectedClientData.phone}</span>}
                    {selectedClientData.email && <span>✉️ {selectedClientData.email}</span>}
                    {selectedClientData.city && <span>📍 {selectedClientData.city}</span>}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-purple-700 font-semibold border border-purple-200">
                  Client Details Loaded
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                {PROJECT_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shoot Date</label>
              <input
                type="date"
                value={projectForm.shootDate}
                onChange={(e) => setProjectForm({ ...projectForm, shootDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Studio Bay / Location</label>
              <select
                value={projectForm.studioLocation}
                onChange={(e) => setProjectForm({ ...projectForm, studioLocation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">— Select Location —</option>
                {STUDIO_LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type of Shoot</label>
              <select
                value={projectForm.shootType}
                onChange={(e) => setProjectForm({ ...projectForm, shootType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">— Select Shoot Type —</option>
                {SHOOT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Base Budget (₹) <span className="text-gray-400 font-normal">— production cost</span></label>
              <input
                type="number"
                min={0}
                value={(projectForm as any).baseBudget || ''}
                onChange={(e) => setProjectForm({ ...projectForm, baseBudget: e.target.value } as any)}
                placeholder="e.g. 30000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contract Amount (₹) <span className="text-gray-400 font-normal">— billed to client</span></label>
              <input
                type="number"
                min={0}
                value={projectForm.budget}
                onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                placeholder="e.g. 75000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            {/* ─── Client's Assigned Models & Auto-Fetched Rates ─── */}
            <div className="md:col-span-2 pt-3 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-[#C59B27]" />
                    Client Assigned Models &amp; Agreed Rates (Auto-Loaded)
                  </label>
                  <p className="text-[11px] text-gray-500">
                    {selectedClientData
                      ? `Automatically fetched from ${selectedClientData.companyName || selectedClientData.fullName}'s saved model rates.`
                      : 'Select a Fashion Client above to automatically load their assigned models and rates.'}
                  </p>
                </div>
                {modalModelAssignments.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
                    {modalModelAssignments.length} Model{modalModelAssignments.length > 1 ? 's' : ''} Linked · Total: {formatCurrency(modalTotalModelCost)}
                  </span>
                )}
              </div>

              {!projectForm.customerId ? (
                <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium">No client selected yet</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Select a client from the dropdown above to automatically fetch their assigned models and agreed rates.
                  </p>
                </div>
              ) : modalModelAssignments.length === 0 ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
                  <p className="text-xs text-amber-800 font-semibold">No models assigned to this client yet</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    You can assign models and set their agreed rates in the <strong>Fashion Clients</strong> page.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-2 px-3 py-1.5 bg-gray-100/80 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Assigned Model</span>
                    <span>Agreed Client Rate (Auto-Applied)</span>
                    <span>Notes</span>
                  </div>
                  {modalModelAssignments.map((a, idx) => {
                    const modelObj = a.model || allModels.find((m) => m.id === a.modelId);
                    return (
                      <div
                        key={a.modelId || idx}
                        className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-2 items-center bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {modelObj?.name || 'Assigned Model'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {modelObj?.gender || 'Fashion Model'} {modelObj?.agency ? `· ${modelObj.agency}` : ''}
                          </p>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            {formatCurrency(a.modelRate)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 truncate">
                            {a.notes || '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── Total Budget Breakdown Box ─── */}
            <div className="md:col-span-2 bg-[#C59B27]/5 border border-[#C59B27]/20 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27]">Total Budget Breakdown</p>
                  <p className="text-xs text-gray-700 mt-0.5">
                    Base Budget: <strong>{formatCurrency(modalBaseBudget)}</strong> + Total Model Cost:{' '}
                    <strong className="text-purple-700">{formatCurrency(modalTotalModelCost)}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Production Cost</p>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(modalTotalBudget)}</p>
                </div>
              </div>
              {modalTotalBudget > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#C59B27]/10 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Contract Amount set: <strong>{formatCurrency(projectForm.budget || 0)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setProjectForm({ ...projectForm, budget: String(modalTotalBudget) })}
                    className="text-[11px] font-semibold text-[#C59B27] hover:underline"
                  >
                    Set Contract to match Total Cost ({formatCurrency(modalTotalBudget)}) →
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3 h-3 text-purple-600" /> Google Drive Delivery Link
              </label>
              <input
                type="url"
                value={projectForm.driveLink}
                onChange={(e) => setProjectForm({ ...projectForm, driveLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={projectForm.notes}
                onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })}
                placeholder="Creative brief, styling notes, references..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={formSaving} className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all disabled:opacity-60 flex items-center gap-1.5">
              {formSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Record Payment">
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-800 font-medium">
            Recording payment for: <strong>{selectedProject?.name}</strong>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number" required min={1} value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder="e.g. 25000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]">
                <option value="UPI">UPI / GPay</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status *</label>
              <select value={payForm.paymentStatus} onChange={(e) => setPayForm({ ...payForm, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]">
                <option value="ADVANCE">Advance / Received</option>
                <option value="PENDING">Pending (not received)</option>
                <option value="DONE">Done — Fully Cleared</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="e.g. Advance via GPay"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button type="submit" disabled={paySaving} className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl flex items-center gap-1.5 disabled:opacity-60">
              {paySaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
