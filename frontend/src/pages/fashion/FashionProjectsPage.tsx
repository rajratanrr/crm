import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Shirt, ChevronRight, X, Trash2, Edit2,
  IndianRupee, Calendar, Link2, MapPin, Film, PackagePlus,
  UserCircle, CheckCircle2, AlertCircle, Loader2, Tag, Clock,
  Building2, ExternalLink, Image as ImageIcon,
} from 'lucide-react';
import {
  projectApi, customerApi, paymentApi, modelApi,
  fashionApi, deliverableApi, formatCurrency, formatDate,
} from '../../services/api';
import { useAutoSync } from '../../hooks/useAutoSync';
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
  { value: 'LOOKBOOK', label: 'Lookbook' },
  { value: 'ECOM_CATALOG', label: 'E-Commerce / Catalog' },
  { value: 'CAMPAIGN', label: 'Campaign / Editorial' },
  { value: 'REEL', label: 'Reels / Short Video' },
  { value: 'FLAT_LAY', label: 'Flat Lay / Mannequin' },
  { value: 'PREMIUM', label: 'Premium Shoot' },
  { value: 'AI_SHOOT', label: 'AI Shoot' },
];
const PRODUCT_TYPES = [
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
    brand: '',
    status: 'PLANNING',
    budget: '',       // contractAmount (client-facing)
    baseBudget: '',   // internal production budget
    studioAmount: '', // studio production amount
    advanceAmount: '', // advance payment received upfront
    quantity: '',     // total dresses / looks
    productType: '',  // product type(s)
    shootDate: '',
    clothInDate: '',
    clothOutDate: '',
    studioLocation: '',
    shootType: '',
    driveLink: '',
    notes: '',
    applyGst: false,  // 18% GST toggle
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

  // Quick payment modal & inline advance entry
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'UPI', paymentStatus: 'ADVANCE', notes: '' });
  const [paySaving, setPaySaving] = useState(false);
  const [quickAdvanceAmount, setQuickAdvanceAmount] = useState('');
  const [quickAdvanceMethod, setQuickAdvanceMethod] = useState('UPI');
  const [quickAdvanceSaving, setQuickAdvanceSaving] = useState(false);

  // Deliverables modal
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [deliverableForm, setDeliverableForm] = useState({
    type: 'LOOKBOOK',
    quantity: 1,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    deliveryLink: '',
    notes: '',
  });
  const [delivSaving, setDelivSaving] = useState(false);


  // ─── Loaders ────────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      const [projRes, custRes, modsRes] = await Promise.all([
        projectApi.getAll({ type: 'FASHION', search: search || undefined }),
        customerApi.getAll({ clientType: 'FASHION' }),
        modelApi.getAll(),
      ]);
      setProjects((projRes.data.data || []).filter((p: any) => p.projectType === 'FASHION'));
      setCustomers(custRes.data.data || []);
      setAllModels(modsRes.data.data || []);
    } catch {
      // Silent fail on auto-sync
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const projRes = await projectApi.getOne(id);
      setSelectedProject(projRes.data.data);

      try {
        const [garReqs, modAssigns, modsRes] = await Promise.all([
          projectApi.getGarments(id),           // /api/projects/:id/garments
          projectApi.getModels(id),             // /api/projects/:id/models
          allModels.length > 0 ? Promise.resolve({ data: { data: allModels } }) : modelApi.getAll(),
        ]);
        setGarments(
          (garReqs.data?.data || []).map((g: any) => ({
            id: g.id, clothType: g.clothType, dressName: g.dressName, quantity: g.quantity,
          }))
        );
        setModelAssignments(
          (modAssigns.data?.data || []).map((a: any) => ({
            id: a.id, modelId: a.modelId, modelRate: Number(a.modelRate), notes: a.notes || '', model: a.model,
          }))
        );
        if (modsRes?.data?.data && allModels.length === 0) {
          setAllModels(modsRes.data.data);
        }
      } catch (subErr) {
        console.warn('Sub-resource fetch warning:', subErr);
      }
    } catch (err: any) {
      console.error('Failed to load project details:', err);
      toast.error(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { setLoading(true); loadProjects(); }, [loadProjects]);

  // Auto-sync: refresh every 10s + on tab focus for cross-employee real-time updates
  useAutoSync(loadProjects, 10000);

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
    const foundCust = customers.find((c) => c.id === p.customerId) || p.customer;
    setSelectedClientData(foundCust || null);

    setEditingProject(p);
    setProjectForm({
      name: p.name || '',
      customerId: p.customerId || '',
      brand: p.brand || foundCust?.companyName || '',
      status: p.status || 'PLANNING',
      budget: p.budget ? String(p.budget) : '',
      baseBudget: p.baseBudget ? String(p.baseBudget) : '',
      studioAmount: p.studioAmount ? String(p.studioAmount) : (p.baseBudget ? String(p.baseBudget) : ''),
      applyGst: false,
      advanceAmount: '',
      quantity: p.quantity != null ? String(p.quantity) : '',
      productType: p.productType || '',
      shootDate: p.shootDate ? p.shootDate.split('T')[0] : '',
      clothInDate: p.clothInDate ? p.clothInDate.split('T')[0] : '',
      clothOutDate: p.clothOutDate ? p.clothOutDate.split('T')[0] : '',
      studioLocation: p.studioLocation || '',
      shootType: p.shootType || '',
      driveLink: p.driveLink || '',
      notes: p.notes || '',
    });

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

  const toggleProjectShootType = (val: string) => {
    const current = projectForm.shootType ? projectForm.shootType.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let updated: string[];
    if (current.includes(val)) {
      updated = current.filter((x) => x !== val);
    } else {
      updated = [...current, val];
    }
    setProjectForm((prev) => ({ ...prev, shootType: updated.join(', ') }));
  };

  const toggleProjectProductType = (val: string) => {
    const current = projectForm.productType ? projectForm.productType.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let updated: string[];
    if (current.includes(val)) {
      updated = current.filter((x) => x !== val);
    } else {
      updated = [...current, val];
    }
    setProjectForm((prev) => ({ ...prev, productType: updated.join(', ') }));
  };

  const toggleModalModel = (modelId: string) => {
    if (modalModelAssignments.some((a) => a.modelId === modelId)) {
      setModalModelAssignments((prev) => prev.filter((a) => a.modelId !== modelId));
    } else {
      const found = allModels.find((m) => m.id === modelId);
      const clientRateObj = selectedClientData?.fashionClientModels?.find((cm: any) => cm.modelId === modelId);
      const defaultRate = clientRateObj ? Number(clientRateObj.defaultRate) : 0;
      setModalModelAssignments((prev) => [
        ...prev,
        { modelId, modelRate: defaultRate, notes: clientRateObj?.notes || '', model: found },
      ]);
    }
  };

  const updateModalModelRate = (index: number, rate: string) => {
    setModalModelAssignments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], modelRate: Number(rate) || 0 };
      return copy;
    });
  };

  const updateModalModelNotes = (index: number, notes: string) => {
    setModalModelAssignments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], notes };
      return copy;
    });
  };

  const removeModalModel = (index: number) => {
    setModalModelAssignments((prev) => prev.filter((_, i) => i !== index));
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

    // Auto-prefill all shoot specifications from client profile
    if (client) {
      const brandOrName = client.companyName || client.fullName;
      setProjectForm((prev) => ({
        ...prev,
        customerId,
        name: prev.name || `${brandOrName} Campaign`,
        brand: client.companyName || prev.brand || '',
        shootType: prev.shootType || client.shootType || '',
        productType: prev.productType || client.productType || '',
        quantity: prev.quantity || (client.garmentCount ? String(client.garmentCount) : ''),
        budget: prev.budget || (client.projectAmount ? String(client.projectAmount) : ''),
        studioAmount: prev.studioAmount || (client.studioAmount ? String(client.studioAmount) : ''),
        baseBudget: prev.baseBudget || (client.studioAmount ? String(client.studioAmount) : ''),
        shootDate: prev.shootDate || (client.shootDate ? client.shootDate.split('T')[0] : ''),
        clothInDate: prev.clothInDate || (client.clothInDate ? client.clothInDate.split('T')[0] : ''),
        clothOutDate: prev.clothOutDate || (client.clothOutDate ? client.clothOutDate.split('T')[0] : ''),
        driveLink: prev.driveLink || client.driveLink || '',
      }));
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
      const resolvedStudioAmount = Number(projectForm.studioAmount) || Number(projectForm.baseBudget) || 0;
      const payload = {
        ...projectForm,
        projectType: 'FASHION',
        budget: Number(projectForm.budget) || 0,           // contractAmount
        baseBudget: Number(projectForm.baseBudget) || resolvedStudioAmount || 0,
        studioAmount: resolvedStudioAmount,
        quantity: projectForm.quantity !== '' ? parseInt(String(projectForm.quantity), 10) || 0 : 0,
        advanceAmount: Number((projectForm as any).advanceAmount) || 0,
        shootDate: projectForm.shootDate || null,
        clothInDate: projectForm.clothInDate || null,
        clothOutDate: projectForm.clothOutDate || null,
        productType: projectForm.productType || null,
        shootType: projectForm.shootType || null,
        brand: projectForm.brand || null,
        driveLink: projectForm.driveLink || null,
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

  const handleQuickAdvanceSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedProject || !quickAdvanceAmount) return;
    const amt = Number(quickAdvanceAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid advance amount');
      return;
    }
    setQuickAdvanceSaving(true);
    try {
      await paymentApi.create({
        customerId: selectedProject.customerId,
        projectId: selectedProject.id,
        domain: 'FASHION',
        amount: amt,
        paymentMethod: quickAdvanceMethod,
        paymentType: 'ADVANCE',
        paymentStatus: 'ADVANCE',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: 'Advance payment recorded',
      });
      toast.success(`Advance payment of ${formatCurrency(amt)} recorded`);
      setQuickAdvanceAmount('');
      loadDetail(selectedProject.id);
      loadProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record advance');
    } finally {
      setQuickAdvanceSaving(false);
    }
  };

  // ─── Deliverables Handlers ───────────────────────────────────────────────────
  const openDeliverableModal = () => {
    setDeliverableForm({
      type: 'LOOKBOOK',
      quantity: 1,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      deliveryLink: selectedProject?.driveLink || '',
      notes: '',
    });
    setIsDeliverableModalOpen(true);
  };

  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setDelivSaving(true);
    try {
      await deliverableApi.create({
        projectId: selectedProject.id,
        domain: 'FASHION',
        type: deliverableForm.type,
        quantity: Number(deliverableForm.quantity) || 1,
        dueDate: deliverableForm.dueDate || null,
        deliveryLink: deliverableForm.deliveryLink || null,
        notes: deliverableForm.notes || null,
        status: 'PENDING',
      });
      toast.success('Deliverable added');
      setIsDeliverableModalOpen(false);
      loadDetail(selectedProject.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add deliverable');
    } finally {
      setDelivSaving(false);
    }
  };

  const handleDeliverableStatusChange = async (delivId: string, status: string) => {
    try {
      await deliverableApi.updateStatus(delivId, status);
      toast.success('Status updated');
      if (selectedProject) loadDetail(selectedProject.id);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteDeliverable = async (delivId: string) => {
    if (!window.confirm('Delete this deliverable?')) return;
    try {
      await deliverableApi.delete(delivId);
      toast.success('Deliverable deleted');
      if (selectedProject) loadDetail(selectedProject.id);
    } catch {
      toast.error('Failed to delete deliverable');
    }
  };

  // ─── Modal Calculations ───────────────────────────────────────────────────────
  const modalTotalModelCost = modalModelAssignments.reduce((s, a) => s + (Number(a.modelRate) || 0), 0);

  const modalBaseBudget = Number((projectForm as any).baseBudget) || 0;
  // Model costs are internal (model accounts) — NOT added to client bill
  const modalTotalBudget = modalBaseBudget;
  const gstRate = 0.18;
  const budgetBaseForGst = Number(projectForm.budget) || 0;
  const gstAmount = Math.round(budgetBaseForGst * gstRate);
  const budgetWithGst = budgetBaseForGst + gstAmount;

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
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 truncate">
                          <span>{p.customer?.fullName}</span>
                          {(p.brand || p.customer?.companyName) && (
                            <span className="text-gray-400 font-medium">· {p.brand || p.customer?.companyName}</span>
                          )}
                        </div>

                        {/* Specs Badges Strip */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {p.shootType && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[150px]">
                              🎬 {p.shootType}
                            </span>
                          )}
                          {p.productType && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200/60 truncate max-w-[150px]">
                              🏷️ {p.productType}
                            </span>
                          )}
                          {Boolean(p.quantity && p.quantity > 0) && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                              👗 {p.quantity} looks
                            </span>
                          )}
                          {p.shootDate && (
                            <span className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" /> {formatDate(p.shootDate)}
                            </span>
                          )}
                          {(p.clothInDate || p.clothOutDate) && (
                            <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> In: {p.clothInDate ? formatDate(p.clothInDate) : '—'}
                            </span>
                          )}
                          {p.driveLink && (
                            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                              <Link2 className="w-2.5 h-2.5" /> Drive
                            </span>
                          )}
                        </div>

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
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedProject.projectNumber} · {selectedProject.customer?.fullName}
                    {(selectedProject.brand || selectedProject.customer?.companyName) && (
                      <span className="font-semibold text-gray-700"> · Brand: {selectedProject.brand || selectedProject.customer?.companyName}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEditModal(selectedProject)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Edit Project & Shoot Specs">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedProject(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ─── Photoshoot Specifications (All 11 Fields) ─── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#C59B27]" /> Photoshoot Specifications &amp; Requirements
                  </h3>
                  <button
                    onClick={() => openEditModal(selectedProject)}
                    className="text-xs text-[#C59B27] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Specs
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client &amp; Brand</p>
                    <p className="text-xs font-bold text-gray-900 mt-1 truncate">{selectedProject.customer?.fullName}</p>
                    <p className="text-[11px] text-[#C59B27] font-semibold truncate">
                      {selectedProject.brand || selectedProject.customer?.companyName || 'No brand set'}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/70">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Type of Shoot</p>
                    <p className="text-xs font-bold text-blue-900 mt-1">
                      {selectedProject.shootType || 'Standard Shoot'}
                    </p>
                    <p className="text-[10px] text-blue-400">Production format</p>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/70">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Qty / Looks</p>
                    <p className="text-base font-bold text-amber-900 mt-0.5">
                      {selectedProject.quantity || (garments.length > 0 ? garments.reduce((s, g) => s + g.quantity, 0) : 0)}
                      <span className="text-xs font-normal text-amber-700 ml-1">looks/dresses</span>
                    </p>
                    <p className="text-[10px] text-amber-500">Garment count</p>
                  </div>

                  <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100/70">
                    <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">Product Type</p>
                    <p className="text-xs font-bold text-pink-900 mt-1 truncate">
                      {selectedProject.productType || 'Fashion Apparel'}
                    </p>
                    <p className="text-[10px] text-pink-400">Outfits / category</p>
                  </div>

                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/70">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Models Assigned</p>
                    <p className="text-xs font-bold text-purple-900 mt-1">
                      {modelAssignments.length} Model{modelAssignments.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-purple-400">Total: {formatCurrency(selectedProject.totalModelCost || 0)}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shoot Date &amp; Bay</p>
                    <p className="text-xs font-bold text-gray-900 mt-1">
                      {selectedProject.shootDate ? formatDate(selectedProject.shootDate) : 'Date not set'}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">{selectedProject.studioLocation || 'Studio'}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Cloth In Date</p>
                    <p className="text-xs font-bold text-indigo-900 mt-1">
                      {selectedProject.clothInDate ? formatDate(selectedProject.clothInDate) : 'Not recorded'}
                    </p>
                    <p className="text-[10px] text-indigo-400">Arrival at studio</p>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/70">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cloth Out Date</p>
                    <p className="text-xs font-bold text-emerald-900 mt-1">
                      {selectedProject.clothOutDate ? formatDate(selectedProject.clothOutDate) : 'Not dispatched'}
                    </p>
                    <p className="text-[10px] text-emerald-400">Returned to client</p>
                  </div>
                </div>

                {/* Studio Amount vs Contract Amount & Drive Link strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Studio Amount (Internal)</span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(selectedProject.studioAmount || selectedProject.baseBudget || 0)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Shoot / Contract Amount</span>
                      <span className="font-bold text-[#C59B27]">{formatCurrency(selectedProject.budget || 0)}</span>
                    </div>
                  </div>

                  <div>
                    {selectedProject.driveLink ? (
                      <a
                        href={selectedProject.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Open Google Drive ↗
                      </a>
                    ) : (
                      <span className="text-gray-400 text-[11px] italic">No Drive delivery link added</span>
                    )}
                  </div>
                </div>
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

                {/* Quick Advance / Payment Entry */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                      Record Advance Received
                    </span>
                    <span className="text-[11px] font-semibold text-amber-800">
                      Pending Balance: <strong>{formatCurrency(selectedProject.remainingAmount || 0)}</strong>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 text-xs text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        min={1}
                        value={quickAdvanceAmount}
                        onChange={(e) => setQuickAdvanceAmount(e.target.value)}
                        placeholder="Enter advance received..."
                        className="w-full pl-6 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-semibold text-gray-800"
                      />
                    </div>
                    <select
                      value={quickAdvanceMethod}
                      onChange={(e) => setQuickAdvanceMethod(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-medium text-gray-700"
                    >
                      <option value="UPI">UPI / GPay</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Card</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleQuickAdvanceSubmit}
                      disabled={quickAdvanceSaving || !quickAdvanceAmount}
                      className="px-4 py-1.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs flex-shrink-0"
                    >
                      {quickAdvanceSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Save Advance
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Saving advance automatically deducts from the pending balance and updates all reports.
                  </p>
                </div>

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

              {/* Deliverables & Client Files */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#C59B27]" /> Deliverables &amp; Client Files
                    {selectedProject.deliverables?.length > 0 && (
                      <span className="text-xs text-gray-400 font-normal">
                        ({selectedProject.deliverables.length})
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openDeliverableModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#B8860B] bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Deliverable
                    </button>
                    <a
                      href="/fashion/deliverables"
                      className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      All Deliverables <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {!selectedProject.deliverables || selectedProject.deliverables.length === 0 ? (
                  <div className="text-center py-5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">No deliverables added for this shoot yet.</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Add Lookbook, E-commerce catalog, or Campaign deliverables to track milestones.
                    </p>
                    <button
                      onClick={openDeliverableModal}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add First Deliverable
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedProject.deliverables.map((del: any) => (
                      <div
                        key={del.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {del.type?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                              Qty: {del.quantity}
                            </span>
                          </div>
                          {del.notes && <p className="text-[11px] text-gray-500">{del.notes}</p>}
                          {del.dueDate && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" /> Due: {formatDate(del.dueDate)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {del.deliveryLink ? (
                            <a
                              href={del.deliveryLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold text-xs"
                            >
                              <Link2 className="w-3.5 h-3.5" /> Drive Link ↗
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No link</span>
                          )}

                          <select
                            value={del.status}
                            onChange={(e) => handleDeliverableStatusChange(del.id, e.target.value)}
                            className={`text-[11px] font-bold border rounded-lg px-2 py-1 outline-none ${
                              del.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : del.status === 'READY'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : del.status === 'IN_PRODUCTION'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-white text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="IN_PRODUCTION">IN PRODUCTION</option>
                            <option value="READY">READY</option>
                            <option value="DELIVERED">DELIVERED</option>
                          </select>

                          <button
                            onClick={() => handleDeleteDeliverable(del.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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

            {/* Client and Brand */}
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
                    {c.fullName} {c.companyName ? `(${c.companyName})` : ''} {c.garmentCount ? `· 👗 ${c.garmentCount} dresses` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={projectForm.brand}
                  onChange={(e) => setProjectForm({ ...projectForm, brand: e.target.value })}
                  placeholder="e.g. Zara, Manyavar, Sabyasachi..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
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
                    {Boolean(selectedClientData.garmentCount && selectedClientData.garmentCount > 0) && (
                      <span className="font-semibold text-purple-800 bg-white/80 px-2 py-0.5 rounded border border-purple-200">
                        👗 {selectedClientData.garmentCount} photoshoot dresses/garments
                      </span>
                    )}
                    {selectedClientData.shootType && (
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        🎬 {selectedClientData.shootType}
                      </span>
                    )}
                    {selectedClientData.productType && (
                      <span className="font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                        🏷️ {selectedClientData.productType}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-purple-700 font-semibold border border-purple-200">
                  Client Details Auto-Loaded
                </span>
              </div>
            )}

            {/* ─── Model Selection (moved to top, right after Client) ─── */}
            <div className="md:col-span-2 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-[#C59B27]" />
                    Model Selection &amp; Agreed Client Rates
                  </label>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {selectedClientData
                      ? `Auto-loaded from ${selectedClientData.companyName || selectedClientData.fullName}'s saved roster.`
                      : 'Tick checkboxes or choose from dropdown to attach models to this shoot.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleModalModel(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27] font-medium text-gray-700"
                  >
                    <option value="">+ Assign Model from List...</option>
                    {allModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.gender ? `(${m.gender})` : ''} {m.agency ? `· ${m.agency}` : ''}
                      </option>
                    ))}
                  </select>
                  {modalModelAssignments.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg whitespace-nowrap">
                      {modalModelAssignments.length} Linked
                    </span>
                  )}
                </div>
              </div>

              {/* Quick-Tick Model Checkboxes */}
              {allModels.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 mb-2.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Quick-Tick Models for this Shoot:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {allModels.map((m) => {
                      const isAssigned = modalModelAssignments.some((a) => a.modelId === m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => toggleModalModel(m.id)}
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

              {modalModelAssignments.length === 0 ? (
                <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-500">No models selected yet — tick above or select client to auto-load</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_32px] gap-2 px-3 py-1.5 bg-gray-100/80 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Model</span>
                    <span>Rate (₹)</span>
                    <span>Notes</span>
                    <span />
                  </div>
                  {modalModelAssignments.map((a, idx) => {
                    const modelObj = a.model || allModels.find((m) => m.id === a.modelId);
                    return (
                      <div
                        key={a.modelId || idx}
                        className="grid grid-cols-[2fr_1.5fr_1.5fr_32px] gap-2 items-center bg-white px-3 py-2 rounded-xl border border-gray-100"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{modelObj?.name || 'Model'}</p>
                          <p className="text-[10px] text-gray-400 truncate">{modelObj?.gender || ''} {modelObj?.agency ? `· ${modelObj.agency}` : ''}</p>
                        </div>
                        <div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs text-gray-400">₹</span>
                            <input
                              type="number" min={0}
                              value={a.modelRate}
                              onChange={(e) => updateModalModelRate(idx, e.target.value)}
                              placeholder="e.g. 15000"
                              className="w-full pl-6 pr-2 py-1 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-semibold"
                            />
                          </div>
                        </div>
                        <div>
                          <input
                            type="text" value={a.notes}
                            onChange={(e) => updateModalModelNotes(idx, e.target.value)}
                            placeholder="Notes"
                            className="w-full px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                          />
                        </div>
                        <div className="flex justify-center">
                          <button type="button" onClick={() => removeModalModel(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── Type of Shoot (Dropdown + Checkbox Pills) ─── */}
            <div className="md:col-span-2 bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-blue-600" />
                    Type of Shoot (Tick checkboxes or select)
                  </label>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) { toggleProjectShootType(e.target.value); } }}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27] font-medium text-gray-700"
                  >
                    <option value="">+ Add Shoot Type from Dropdown...</option>
                    {SHOOT_TYPES.map((st) => (
                      <option key={st.value} value={st.label}>{st.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SHOOT_TYPES.map((st) => {
                    const selectedTypes = projectForm.shootType
                      ? projectForm.shootType.split(',').map((s) => s.trim().toLowerCase())
                      : [];
                    const isChecked =
                      selectedTypes.includes(st.label.toLowerCase()) ||
                      selectedTypes.includes(st.value.toLowerCase());
                    return (
                      <button
                        type="button" key={st.value}
                        onClick={() => toggleProjectShootType(st.label)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isChecked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isChecked ? 'bg-white text-blue-600' : 'border border-gray-300'
                        }`}>{isChecked ? '✓' : ''}</span>
                        {st.label}
                      </button>
                    );
                  })}
                </div>
                {projectForm.shootType && (
                  <p className="text-[11px] text-blue-700 font-semibold">
                    Selected: {projectForm.shootType}
                  </p>
                )}
              </div>
            </div>

            {/* ─── Product Type / Outfits (Dropdown + Checkbox Pills) ─── */}
            <div className="md:col-span-2 bg-pink-50/40 border border-pink-100 rounded-xl p-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-pink-600" />
                    Product Type / Outfits (Tick checkboxes or select)
                  </label>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) { toggleProjectProductType(e.target.value); } }}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27] font-medium text-gray-700"
                  >
                    <option value="">+ Add Product Type...</option>
                    {PRODUCT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_TYPES.map((pt) => {
                    const selectedProds = projectForm.productType
                      ? projectForm.productType.split(',').map((s) => s.trim().toLowerCase())
                      : [];
                    const isChecked = selectedProds.includes(pt.toLowerCase());
                    return (
                      <button
                        type="button" key={pt}
                        onClick={() => toggleProjectProductType(pt)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isChecked ? 'bg-[#C59B27] text-white border-[#C59B27]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#C59B27]/40'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isChecked ? 'bg-white text-[#C59B27]' : 'border border-gray-300'
                        }`}>{isChecked ? '✓' : ''}</span>
                        {pt}
                      </button>
                    );
                  })}
                </div>
                {projectForm.productType && (
                  <p className="text-[11px] text-[#C59B27] font-semibold">
                    Selected: {projectForm.productType}
                  </p>
                )}
              </div>
            </div>

            {/* Qty / Looks Count */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Qty / Looks Count <span className="text-gray-400 font-normal">— dresses</span>
              </label>
              <div className="relative">
                <Shirt className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number" min={0}
                  value={projectForm.quantity}
                  onChange={(e) => setProjectForm({ ...projectForm, quantity: e.target.value })}
                  placeholder="e.g. 20"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                {PROJECT_STATUS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Shoot Date + Studio Bay/Location — same row */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shoot Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={projectForm.shootDate}
                  onChange={(e) => setProjectForm({ ...projectForm, shootDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Studio Bay / Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <select
                  value={projectForm.studioLocation}
                  onChange={(e) => setProjectForm({ ...projectForm, studioLocation: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
                >
                  <option value="">— Select Location —</option>
                  {STUDIO_LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cloth In & Out Dates — same row */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cloth In Date <span className="text-gray-400 font-normal">— samples arrival</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-indigo-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={projectForm.clothInDate}
                  onChange={(e) => setProjectForm({ ...projectForm, clothInDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-indigo-200 bg-indigo-50/20 rounded-lg outline-none focus:border-indigo-400"
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
                  value={projectForm.clothOutDate}
                  onChange={(e) => setProjectForm({ ...projectForm, clothOutDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-emerald-200 bg-emerald-50/20 rounded-lg outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Studio Amount (internal production cost) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Studio Amount (₹) <span className="text-gray-400 font-normal">— bay / production cost (internal)</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number" min={0}
                  value={projectForm.studioAmount}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      studioAmount: e.target.value,
                      baseBudget: e.target.value,
                    })
                  }
                  placeholder="e.g. 30000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] font-semibold"
                />
              </div>
            </div>

            {/* Advance Received */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Advance Received (₹) <span className="text-gray-400 font-normal">— upfront payment</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="number" min={0}
                  value={(projectForm as any).advanceAmount || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, advanceAmount: e.target.value } as any)}
                  placeholder="e.g. 25000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
              {Number(projectForm.budget) > 0 && (
                <p className="text-[10px] text-gray-500 mt-1 flex justify-between">
                  <span>Pending Balance:</span>
                  <strong className="text-amber-700 font-bold">
                    {formatCurrency(Math.max(0, Number(projectForm.budget || 0) - Number((projectForm as any).advanceAmount || 0)))}
                  </strong>
                </p>
              )}
            </div>

            {/* ─── Internal Cost Info (Model Fees — NOT added to client bill) ─── */}
            {modalTotalModelCost > 0 && (
              <div className="md:col-span-2 bg-purple-50/50 border border-purple-200/50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Model Fees (Internal — tracked in model accounts)</p>
                <p className="text-xs text-gray-700 mt-0.5">
                  Total model fees: <strong className="text-purple-700">{formatCurrency(modalTotalModelCost)}</strong>
                  <span className="text-gray-400 ml-2">— paid to models separately, not added to client bill</span>
                </p>
              </div>
            )}

            {/* ─── Shoot / Contract Amount — BILLED TO CLIENT (at bottom) ─── */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Shoot / Contract Amount (₹)
                <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Billed to Client
                </span>
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                <input
                  type="number" min={0}
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  placeholder="e.g. 75000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-emerald-300 bg-emerald-50/30 rounded-lg outline-none focus:border-emerald-500 font-bold text-gray-900"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">This is the amount charged to the client for the full photoshoot project.</p>

              {/* ─── 18% GST Toggle ─── */}
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={(projectForm as any).applyGst || false}
                    onChange={(e) => setProjectForm({ ...projectForm, applyGst: e.target.checked } as any)}
                    className="w-4 h-4 rounded border-gray-300 text-[#C59B27] focus:ring-[#C59B27] accent-[#C59B27]"
                  />
                  <span className="text-xs font-semibold text-gray-700">Apply 18% GST</span>
                </label>
                {(projectForm as any).applyGst && budgetBaseForGst > 0 && (
                  <div className="mt-2 bg-blue-50/60 border border-blue-200/50 rounded-lg p-2.5 space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Base Amount:</span>
                      <strong>{formatCurrency(budgetBaseForGst)}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>GST (18%):</span>
                      <strong>{formatCurrency(gstAmount)}</strong>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-900 pt-1 border-t border-blue-200/40">
                      <span>Total with GST:</span>
                      <span>{formatCurrency(budgetWithGst)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProjectForm({ ...projectForm, budget: String(budgetWithGst) })}
                      className="mt-1 text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      Set Contract = ₹{budgetWithGst.toLocaleString('en-IN')} (incl. GST) →
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" /> Google Drive Delivery Link
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

      {/* Add Deliverable Modal */}
      <Modal
        isOpen={isDeliverableModalOpen}
        onClose={() => setIsDeliverableModalOpen(false)}
        title={`Add Deliverable — ${selectedProject?.name || 'Project'}`}
      >
        <form onSubmit={handleCreateDeliverable} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deliverable Type *</label>
              <select
                value={deliverableForm.type}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="LOOKBOOK">Lookbook High-Res</option>
                <option value="ECOM_CATALOG">E-commerce Web Catalog</option>
                <option value="CAMPAIGN_EDIT">Commercial Campaign Edit</option>
                <option value="EDITED_PHOTOS">Retouched Master Stills</option>
                <option value="REEL">Social Media Reels / Teaser</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={deliverableForm.quantity}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, quantity: +e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Due Date *</label>
              <input
                type="date"
                required
                value={deliverableForm.dueDate}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" /> Google Drive / Assets Link
              </label>
              <input
                type="url"
                value={deliverableForm.deliveryLink}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, deliveryLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Specifications / Notes</label>
              <input
                type="text"
                value={deliverableForm.notes}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, notes: e.target.value })}
                placeholder="e.g. 4K ProRes, 300 DPI, white background catalog"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsDeliverableModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={delivSaving}
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {delivSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Deliverable
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

