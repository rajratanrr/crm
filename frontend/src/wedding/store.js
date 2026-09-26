import { create } from 'zustand';
import {
  customerApi,
  projectApi,
  leadApi,
  paymentApi,
  deliverableApi,
  employeeApi,
  eventApi,
} from '../services/api';

const uid = () => Math.random().toString(36).slice(2, 10);
const today = new Date().toISOString().slice(0, 10);

const cleanPhone = (phone) => {
  if (!phone) return '9876543210';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits.padEnd(10, '0');
};

const mapDbCustomerToClient = (c) => {
  let bride = c.fullName || 'Client';
  let groom = '';
  if (c.fullName && c.fullName.includes('&')) {
    const parts = c.fullName.split('&');
    bride = parts[0]?.trim() || '';
    groom = parts[1]?.trim() || '';
  }
  return {
    id: c.id,
    brideName: bride,
    groomName: groom,
    phone: c.phone || '',
    email: c.email || '',
    weddingDate: c.shootDate ? String(c.shootDate).slice(0, 10) : '',
    venue: c.address || c.city || '',
    createdAt: c.createdAt ? String(c.createdAt).slice(0, 10) : today,
    rawCustomer: c,
  };
};

const mapDbProjectToProject = (p, existing) => {
  const paymentsList = p.payments || [];
  const amountPaid = paymentsList.reduce((sum, pay) => sum + Number(pay.amount || 0), 0) || Number(p.totalPaid || 0);

  const deliverables = (p.deliverables && p.deliverables.length > 0)
    ? p.deliverables.map((d) => ({
        id: d.id,
        name: d.notes || d.type || 'Deliverable',
        status: d.status || 'PENDING',
        dueDate: d.dueDate ? String(d.dueDate).slice(0, 10) : '',
        type: d.type || '',
        deliveryLink: d.deliveryLink || '',
        notes: d.notes || '',
        dbDeliverable: d, // Keep reference to original DB record
      }))
    : (existing?.deliverables || []);

  const events = (p.events && p.events.length > 0)
    ? p.events.map((e) => ({
        id: e.id,
        name: e.eventName || e.name || 'Event',
        date: e.startDate ? String(e.startDate).slice(0, 10) : '',
        startTime: e.startDate ? String(e.startDate).slice(11, 16) : '10:00',
        endTime: e.endDate ? String(e.endDate).slice(11, 16) : '18:00',
        venue: e.venue || '',
        team: (e.assignments || []).map((a) => a.employee?.name || a.employeeId),
      }))
    : (existing?.events || []);

  return {
    id: p.id,
    name: p.name,
    clientId: p.customerId,
    totalBudget: Number(p.budget || p.contractAmount || 0),
    amountPaid,
    status: p.status || 'PLANNING',
    weddingDate: p.weddingDate ? String(p.weddingDate).slice(0, 10) : (p.startDate ? String(p.startDate).slice(0, 10) : ''),
    venue: p.venue || p.city || '',
    deliverables,
    events,
    projectType: p.projectType || 'WEDDING',
    rawProject: p,
  };
};

const mapDbLeadToLead = (l) => ({
  id: l.id,
  name: l.name,
  phone: l.phone || '',
  weddingDate: l.estimatedDate ? String(l.estimatedDate).slice(0, 10) : '',
  location: l.shootType || l.notes || 'Studio',
  source: l.source || 'Website',
  status: l.status === 'WON' ? 'BOOKED' : l.status || 'NEW',
  budget: Number(l.estimatedBudget || 0),
  assignedTo: l.assignedUser?.name || l.assignedTo || 'Team',
  rawLead: l,
});

const mapDbPaymentToPayment = (pay) => ({
  id: pay.id,
  projectId: pay.projectId,
  customerId: pay.customerId,
  contractId: pay.contractId,
  amount: Number(pay.amount),
  method: pay.paymentMethod === 'BANK_TRANSFER' ? 'Bank' : pay.paymentMethod === 'UPI' ? 'UPI' : pay.paymentMethod === 'CASH' ? 'Cash' : pay.paymentMethod || 'UPI',
  date: pay.paymentDate ? String(pay.paymentDate).slice(0, 10) : (pay.createdAt ? String(pay.createdAt).slice(0, 10) : today),
  description: pay.notes || pay.paymentType || 'Payment',
  reference: pay.referenceNumber || '',
  rawPayment: pay,
});

// =====================================================
// NO localStorage persistence — always fresh from PostgreSQL
// This ensures all employees see the same real-time data
// =====================================================
export const useStore = create((set, get) => ({
  leads: [],
  clients: [],
  projects: [],
  payments: [],
  expenses: [],
  salaries: [],
  attendance: [],
  invoices: [],
  payroll: [],
  bundles: [],
  team: [],
  tasks: [],
  isSyncing: false,
  lastSyncedAt: null,
  _initialLoaded: false,

  // ==========================================
  // LIVE POSTGRESQL DATABASE SYNC
  // Always fetches fresh from the central database
  // ==========================================
  fetchFromDb: async () => {
    // Prevent concurrent fetches
    if (get().isSyncing) return;
    try {
      set({ isSyncing: true });
      const [customersRes, projectsRes, leadsRes, paymentsRes, teamRes] = await Promise.all([
        customerApi.getAll({ clientType: 'WEDDING', limit: 250 }).catch(() => ({ data: { data: [] } })),
        projectApi.getAll({ type: 'WEDDING', projectType: 'WEDDING', limit: 250 }).catch(() => ({ data: { data: [] } })),
        leadApi.getAll({ clientType: 'WEDDING', limit: 250 }).catch(() => ({ data: { data: [] } })),
        paymentApi.getAll({ domain: 'WEDDING', limit: 250 }).catch(() => ({ data: { data: [] } })),
        employeeApi.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
      ]);

      // Strictly isolate WEDDING domain only — never mix with Fashion
      const rawCustomers = (customersRes.data?.data || []).filter(
        (c) => c.clientType === 'WEDDING'
      );
      const rawProjects = (projectsRes.data?.data || []).filter(
        (p) => p.projectType === 'WEDDING'
      );
      const rawLeads = (leadsRes.data?.data || []).filter(
        (l) => l.clientType === 'WEDDING' || (!l.clientType && l.eventType)
      );
      const rawPayments = (paymentsRes.data?.data || []).filter(
        (pay) => pay.domain === 'WEDDING' || pay.project?.projectType === 'WEDDING'
      );
      const rawTeam = teamRes.data?.data || [];

      const existingProjects = get().projects;
      const dbClients = rawCustomers.map(mapDbCustomerToClient);
      const dbProjects = rawProjects.map((p) => {
        const ex = existingProjects.find((x) => x.id === p.id);
        return mapDbProjectToProject(p, ex);
      });
      const dbLeads = rawLeads.map(mapDbLeadToLead);
      const dbPayments = rawPayments.map(mapDbPaymentToPayment);
      const dbTeam = rawTeam.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role || 'Staff',
        type: String(t.role || '').toUpperCase().includes('PHOTO') ? 'PHOTOGRAPHER' : 'VIDEOGRAPHER',
        email: t.email,
        phone: t.phone,
        active: t.isActive ?? true,
      }));

      // Always replace with fresh DB data — never fall back to stale cache
      set({
        clients: dbClients,
        projects: dbProjects,
        leads: dbLeads,
        payments: dbPayments,
        team: dbTeam,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        _initialLoaded: true,
      });
    } catch (err) {
      console.warn('PostgreSQL fetch error:', err);
      set({ isSyncing: false });
    }
  },

  // ==========================================
  // CLIENTS (POSTGRESQL CONNECTED)
  // ==========================================
  addClient: async (c) => {
    const bride = c.brideName?.trim() || '';
    const groom = c.groomName?.trim() || '';
    const fullName = bride && groom ? `${bride} & ${groom}` : bride || groom || 'Wedding Client';
    const phone = cleanPhone(c.phone);

    // Optimistic UI update
    const tempId = uid();
    const optimisticClient = { ...c, id: tempId, brideName: bride, groomName: groom, phone, createdAt: today };
    set((s) => ({ clients: [optimisticClient, ...s.clients] }));

    try {
      const res = await customerApi.create({
        fullName,
        phone,
        email: c.email || undefined,
        clientType: 'WEDDING',
        address: c.venue || undefined,
        city: c.venue || undefined,
        shootDate: c.weddingDate ? c.weddingDate : undefined,
      });

      const savedDbCustomer = res.data?.data;
      if (savedDbCustomer?.id) {
        const realClient = mapDbCustomerToClient(savedDbCustomer);
        set((s) => ({
          clients: s.clients.map((item) => (item.id === tempId ? realClient : item)),
        }));
        setTimeout(() => get().fetchFromDb(), 300);
        return realClient;
      }
    } catch (err) {
      console.error('Failed to create client in PostgreSQL database:', err?.response?.data || err);
    }
    return optimisticClient;
  },

  updateClient: async (id, patch) => {
    // Optimistic update
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

    try {
      const client = get().clients.find((c) => c.id === id);
      const bride = patch.brideName !== undefined ? patch.brideName : client?.brideName;
      const groom = patch.groomName !== undefined ? patch.groomName : client?.groomName;
      const fullName = bride && groom ? `${bride} & ${groom}` : bride || groom;

      const payload = {
        ...(fullName && { fullName }),
        ...(patch.phone && { phone: cleanPhone(patch.phone) }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.venue !== undefined && { address: patch.venue, city: patch.venue }),
        ...(patch.weddingDate && { shootDate: patch.weddingDate }),
      };

      await customerApi.update(id, payload);
      // Re-fetch to ensure consistency across all employees
      setTimeout(() => get().fetchFromDb(), 300);
    } catch (err) {
      console.error('Failed to update client in PostgreSQL database:', err?.response?.data || err);
    }
  },

  deleteClient: async (id) => {
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
    try {
      await customerApi.delete(id);
      setTimeout(() => get().fetchFromDb(), 300);
    } catch (err) {
      console.error('Failed to delete client in PostgreSQL database:', err?.response?.data || err);
    }
  },

  // ==========================================
  // PROJECTS (POSTGRESQL CONNECTED)
  // ==========================================
  addProject: async (p) => {
    const tempId = uid();
    const optimisticProject = { ...p, id: tempId };
    set((s) => ({ projects: [optimisticProject, ...s.projects] }));

    try {
      // Resolve customer ID
      let customerId = p.clientId;
      if (!customerId || customerId.startsWith('c')) {
        let matchedClient = p.clientId ? get().clients.find((c) => c.id === p.clientId) : null;
        if (!matchedClient && p.clientPhone) {
          const digits = cleanPhone(p.clientPhone);
          matchedClient = get().clients.find((c) => cleanPhone(c.phone) === digits);
        }
        if (matchedClient?.rawCustomer?.id) {
          customerId = matchedClient.rawCustomer.id;
        } else if (matchedClient?.id && !matchedClient.id.startsWith('c')) {
          customerId = matchedClient.id;
        } else if (matchedClient) {
          const newCust = await customerApi.create({
            fullName: `${matchedClient.brideName || ''} & ${matchedClient.groomName || ''}`.trim() || p.name || 'Wedding Client',
            phone: cleanPhone(matchedClient.phone || p.clientPhone),
            clientType: 'WEDDING',
            address: p.venue || matchedClient.venue || undefined,
            shootDate: p.weddingDate || matchedClient.weddingDate || undefined,
          });
          customerId = newCust.data?.data?.id;
          if (newCust.data?.data) {
            const addedClient = mapDbCustomerToClient(newCust.data.data);
            set((s) => ({ clients: [addedClient, ...s.clients] }));
          }
        } else {
          // If no client exists at all, auto-create one from project details
          const newCust = await customerApi.create({
            fullName: p.name || 'Wedding Client',
            phone: cleanPhone(p.clientPhone),
            clientType: 'WEDDING',
            address: p.venue || undefined,
            shootDate: p.weddingDate || undefined,
          });
          customerId = newCust.data?.data?.id;
          if (newCust.data?.data) {
            const addedClient = mapDbCustomerToClient(newCust.data.data);
            set((s) => ({ clients: [addedClient, ...s.clients] }));
          }
        }
      }

      if (!customerId) {
        console.error('Cannot create project: no valid customer ID resolved');
        set((s) => ({ projects: s.projects.filter((x) => x.id !== tempId) }));
        return null;
      }

      // Map status: 'BOOKING' is not a valid Prisma enum, use 'PLANNING' or 'CONFIRMED'
      let resolvedStatus = p.status || 'PLANNING';
      const validStatuses = ['PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'EDITING', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(resolvedStatus)) {
        // Map frontend-only statuses to valid backend statuses
        const statusMap = {
          'BOOKING': 'CONFIRMED',
          'LEAD': 'PLANNING',
          'CONSULTATION': 'PLANNING',
          'PROPOSAL': 'PLANNING',
          'SHOOTING': 'IN_PROGRESS',
          'DELIVERY': 'IN_PROGRESS',
        };
        resolvedStatus = statusMap[resolvedStatus] || 'PLANNING';
      }

      const payload = {
        name: p.name,
        customerId,
        budget: Number(p.totalBudget) || 0,
        advanceAmount: Number(p.amountPaid) || 0,
        projectType: 'WEDDING',
        status: resolvedStatus,
        weddingDate: p.weddingDate || undefined,
        venue: p.venue || undefined,
      };

      const res = await projectApi.create(payload);
      const savedProject = res.data?.data;
      if (savedProject?.id) {
        const realProject = mapDbProjectToProject(savedProject, p);
        set((s) => ({
          projects: s.projects.map((item) => (item.id === tempId ? realProject : item)),
        }));

        // Create deliverables in the database for the new project
        if (p.deliverables && p.deliverables.length > 0) {
          for (const d of p.deliverables) {
            if (!d.name?.trim()) continue;
            try {
              await deliverableApi.create({
                projectId: savedProject.id,
                domain: 'WEDDING',
                type: 'EDITED_PHOTOS',
                notes: d.name.trim(),
                status: 'PENDING',
                dueDate: d.dueDate || undefined,
              });
            } catch (delErr) {
              console.error('Failed to create deliverable:', delErr?.response?.data || delErr);
            }
          }
        }

        // Create events in the database for the new project
        if (p.events && p.events.length > 0) {
          for (const e of p.events) {
            if (!e.name?.trim() || !e.date) continue;
            try {
              await eventApi.create({
                eventName: e.name.trim(),
                eventType: 'WEDDING',
                customerId: customerId,
                projectId: savedProject.id,
                startDate: e.date,
                venue: e.venue || undefined,
              });
            } catch (evtErr) {
              console.error('Failed to create event:', evtErr?.response?.data || evtErr);
            }
          }
        }

        // Refresh to get full data from DB
        setTimeout(() => get().fetchFromDb(), 500);
        return realProject;
      }
    } catch (err) {
      console.error('Failed to create project in PostgreSQL database:', err?.response?.data || err);
      // Remove optimistic entry on failure
      set((s) => ({ projects: s.projects.filter((x) => x.id !== tempId) }));
    }
    return null;
  },

  updateProject: async (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

    try {
      const payload = {
        ...(patch.name && { name: patch.name }),
        ...(patch.totalBudget !== undefined && { budget: Number(patch.totalBudget) }),
        ...(patch.status && { status: patch.status }),
        ...(patch.weddingDate && { weddingDate: patch.weddingDate }),
        ...(patch.venue && { venue: patch.venue }),
      };

      // Only send to backend if there are actual project fields to update
      const hasProjectFields = Object.keys(payload).length > 0;
      if (hasProjectFields) {
        // Map status to valid Prisma enum before sending
        if (payload.status) {
          const validStatuses = ['PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'EDITING', 'COMPLETED', 'CANCELLED'];
          if (!validStatuses.includes(payload.status)) {
            const statusMap = {
              'BOOKING': 'CONFIRMED',
              'LEAD': 'PLANNING',
              'CONSULTATION': 'PLANNING',
              'PROPOSAL': 'PLANNING',
              'SHOOTING': 'IN_PROGRESS',
              'DELIVERY': 'IN_PROGRESS',
            };
            payload.status = statusMap[payload.status] || 'PLANNING';
          }
        }
        await projectApi.update(id, payload);
      }

      // Re-fetch to ensure consistency across all employees
      setTimeout(() => get().fetchFromDb(), 500);
    } catch (err) {
      console.error('Failed to update project in PostgreSQL database:', err?.response?.data || err);
    }
  },

  deleteProject: async (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    try {
      await projectApi.delete(id);
      setTimeout(() => get().fetchFromDb(), 300);
    } catch (err) {
      console.error('Failed to delete project in PostgreSQL database:', err?.response?.data || err);
    }
  },

  // ==========================================
  // DELIVERABLES (POSTGRESQL CONNECTED)
  // All CRUD operations go through the deliverableApi
  // ==========================================
  addDeliverable: async (deliverable) => {
    try {
      const payload = {
        projectId: deliverable.projectId || undefined,
        domain: 'WEDDING',
        type: deliverable.dbType || 'EDITED_PHOTOS',
        notes: deliverable.name?.trim() || deliverable.notes?.trim() || 'Deliverable',
        status: deliverable.status || 'PENDING',
        dueDate: deliverable.dueDate || undefined,
        deliveryLink: deliverable.deliveryLink || undefined,
      };

      const res = await deliverableApi.create(payload);
      if (res.data?.data?.id) {
        // Refresh data from DB to update project deliverables
        setTimeout(() => get().fetchFromDb(), 300);
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to create deliverable in PostgreSQL:', err?.response?.data || err);
      throw err; // Re-throw so caller can handle
    }
    return null;
  },

  updateDeliverable: async (id, patch) => {
    try {
      const payload = {};
      if (patch.name !== undefined) payload.notes = patch.name;
      if (patch.notes !== undefined) payload.notes = patch.notes;
      if (patch.status !== undefined) {
        // Map frontend statuses to valid backend DeliverableStatus enum
        const statusMap = {
          'PENDING': 'PENDING',
          'IN_PROGRESS': 'IN_PRODUCTION',
          'IN_PRODUCTION': 'IN_PRODUCTION',
          'EDITING': 'IN_PRODUCTION',
          'COMPLETED': 'READY',
          'READY': 'READY',
          'CLIENT_SELECTION': 'IN_PRODUCTION',
          'DELIVERED': 'DELIVERED',
        };
        payload.status = statusMap[patch.status] || patch.status;
      }
      if (patch.dueDate !== undefined) payload.dueDate = patch.dueDate || null;
      if (patch.deliveryLink !== undefined) payload.deliveryLink = patch.deliveryLink || null;
      if (patch.projectId !== undefined) payload.projectId = patch.projectId;

      const res = await deliverableApi.update(id, payload);
      if (res.data?.data) {
        setTimeout(() => get().fetchFromDb(), 300);
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to update deliverable in PostgreSQL:', err?.response?.data || err);
      throw err;
    }
    return null;
  },

  deleteDeliverable: async (id) => {
    try {
      await deliverableApi.delete(id);
      setTimeout(() => get().fetchFromDb(), 300);
    } catch (err) {
      console.error('Failed to delete deliverable in PostgreSQL:', err?.response?.data || err);
      throw err;
    }
  },

  // ==========================================
  // PAYMENTS (POSTGRESQL CONNECTED)
  // ==========================================
  addPayment: async (pay) => {
    const tempId = uid();
    set((s) => ({ payments: [{ ...pay, id: tempId }, ...s.payments] }));

    try {
      // Resolve customerId from the project
      let customerId = pay.customerId;
      if (!customerId && pay.projectId) {
        const project = get().projects.find((x) => x.id === pay.projectId);
        if (project?.clientId) {
          customerId = project.clientId;
        }
        // If the project has raw data with customerId, use that
        if (!customerId && project?.rawProject?.customerId) {
          customerId = project.rawProject.customerId;
        }
      }

      if (!customerId) {
        console.error('Cannot create payment: no customer ID found. Project:', pay.projectId);
        // Remove optimistic entry
        set((s) => ({ payments: s.payments.filter((x) => x.id !== tempId) }));
        return null;
      }

      const payload = {
        customerId,
        projectId: pay.projectId,
        amount: Number(pay.amount),
        paymentMethod: pay.method === 'UPI' ? 'UPI' : pay.method === 'Bank' ? 'BANK_TRANSFER' : pay.method === 'Cash' ? 'CASH' : 'OTHER',
        paymentType: 'MID_PAYMENT',
        paymentDate: pay.date || new Date().toISOString(),
        reference: pay.reference || undefined,
        notes: pay.description || undefined,
        domain: 'WEDDING',
      };
      const res = await paymentApi.create(payload);
      if (res.data?.data?.id) {
        set((s) => ({
          payments: s.payments.map((item) => (item.id === tempId ? mapDbPaymentToPayment(res.data.data) : item)),
        }));
        setTimeout(() => get().fetchFromDb(), 500);
      }
    } catch (err) {
      console.error('Failed to create payment in PostgreSQL database:', err?.response?.data || err);
      // Remove optimistic entry on failure
      set((s) => ({ payments: s.payments.filter((x) => x.id !== tempId) }));
    }
  },

  updatePayment: async (id, patch) => {
    set((s) => ({
      payments: s.payments.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)),
    }));
    try {
      const payload = {};
      if (patch.amount !== undefined) payload.amount = Number(patch.amount);
      if (patch.method) {
        payload.paymentMethod = patch.method === 'UPI' ? 'UPI' : patch.method === 'Bank' ? 'BANK_TRANSFER' : patch.method === 'Cash' ? 'CASH' : 'OTHER';
      }
      if (patch.date) payload.paymentDate = patch.date;
      if (patch.description !== undefined) payload.notes = patch.description;
      if (patch.reference !== undefined) payload.reference = patch.reference;

      await paymentApi.update(id, payload);
      setTimeout(() => get().fetchFromDb(), 500);
    } catch (err) {
      console.error('Failed to update payment in PostgreSQL database:', err?.response?.data || err);
    }
  },

  deletePayment: async (id) => {
    set((s) => ({ payments: s.payments.filter((payment) => payment.id !== id) }));
    try {
      await paymentApi.delete(id);
      setTimeout(() => get().fetchFromDb(), 300);
    } catch (err) {
      console.error('Failed to delete payment in PostgreSQL database:', err?.response?.data || err);
    }
  },

  // ==========================================
  // LEADS (POSTGRESQL CONNECTED)
  // ==========================================
  addLead: async (lead) => {
    const tempId = uid();
    set((s) => ({ leads: [{ ...lead, id: tempId }, ...s.leads] }));
    try {
      const res = await leadApi.create({
        name: lead.name,
        phone: cleanPhone(lead.phone),
        clientType: 'WEDDING',
        estimatedBudget: Number(lead.budget) || undefined,
        estimatedDate: lead.weddingDate || undefined,
        source: lead.source || undefined,
        status: lead.status || 'NEW',
        notes: lead.location || undefined,
      });
      if (res.data?.data?.id) {
        set((s) => ({
          leads: s.leads.map((l) => (l.id === tempId ? mapDbLeadToLead(res.data.data) : l)),
        }));
      }
    } catch (err) {
      console.error('Failed to create lead in PostgreSQL database:', err?.response?.data || err);
    }
  },

  updateLead: async (id, patch) => {
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    try {
      const payload = {
        ...(patch.name && { name: patch.name }),
        ...(patch.phone && { phone: cleanPhone(patch.phone) }),
        ...(patch.budget !== undefined && { estimatedBudget: Number(patch.budget) }),
        ...(patch.status && { status: patch.status === 'BOOKED' ? 'WON' : patch.status }),
        ...(patch.weddingDate && { estimatedDate: patch.weddingDate }),
        ...(patch.location && { notes: patch.location }),
      };
      await leadApi.update(id, payload);
    } catch (err) {
      console.error('Failed to update lead in PostgreSQL database:', err?.response?.data || err);
    }
  },

  deleteLead: async (id) => {
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
    try {
      await leadApi.delete(id);
    } catch (err) {
      console.error('Failed to delete lead in PostgreSQL database:', err?.response?.data || err);
    }
  },

  convertLeadToClient: async (leadId) => {
    const lead = get().leads.find((l) => l.id === leadId);
    if (!lead) return;
    const phone = cleanPhone(lead.phone);
    const existingClient = get().clients.find((client) => cleanPhone(client.phone) === phone);
    if (lead.status === 'BOOKED') return existingClient;

    const [bride = '', groom = ''] = lead.name.split('&').map((x) => x.trim());
    const newClientData = {
      brideName: bride || lead.name,
      groomName: groom,
      phone,
      email: '',
      weddingDate: lead.weddingDate,
      venue: lead.location,
    };

    const client = await get().addClient(newClientData);
    await get().updateLead(leadId, { status: 'BOOKED' });
    return existingClient || client;
  },

  // Other entities
  addInvoice: (invoice) => set((s) => ({ invoices: [{ ...invoice, id: uid() }, ...s.invoices] })),
  updateInvoice: (id, patch) => set((s) => ({ invoices: s.invoices.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)) })),
  deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) })),

  addExpense: (expense) => set((s) => ({ expenses: [{ ...expense, id: uid() }, ...s.expenses] })),
  updateExpense: (id, patch) => set((s) => ({ expenses: s.expenses.map((exp) => (exp.id === id ? { ...exp, ...patch } : exp)) })),
  deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((exp) => exp.id !== id) })),

  addSalary: (salary) => set((s) => ({ salaries: [{ ...salary, id: uid() }, ...s.salaries] })),
  updateSalary: (id, patch) => set((s) => ({ salaries: s.salaries.map((sal) => (sal.id === id ? { ...sal, ...patch } : sal)) })),
  deleteSalary: (id) => set((s) => ({ salaries: s.salaries.filter((sal) => sal.id !== id) })),
  addPayroll: (record) => set((s) => ({ payroll: [{ ...record, id: uid() }, ...s.payroll] })),
  updatePayroll: (id, patch) => set((s) => ({ payroll: s.payroll.map((pay) => (pay.id === id ? { ...pay, ...patch } : pay)) })),
  deletePayroll: (id) => set((s) => ({ payroll: s.payroll.filter((pay) => pay.id !== id) })),

  addBundle: (bundle) => set((s) => ({ bundles: [{ ...bundle, id: uid() }, ...s.bundles] })),
  updateBundle: (id, patch) => set((s) => ({ bundles: s.bundles.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  deleteBundle: (id) => set((s) => ({ bundles: s.bundles.filter((b) => b.id !== id) })),

  importDeliverables: async (projectId, deliverables) => {
    try {
      for (const d of deliverables) {
        await deliverableApi.create({
          projectId,
          notes: d.name,
          domain: 'WEDDING',
          type: 'EDITED_PHOTOS',
          status: 'PENDING',
          dueDate: d.dueDate || undefined,
        });
      }
      setTimeout(() => get().fetchFromDb(), 500);
    } catch (err) {
      console.error('Failed to sync deliverables to database:', err?.response?.data || err);
    }
  },

  setAttendance: (record) => set((s) => {
    const exists = s.attendance.some((item) => item.eventId === record.eventId && item.date === record.date && item.memberId === record.memberId);
    return {
      attendance: exists
        ? s.attendance.map((item) => item.eventId === record.eventId && item.date === record.date && item.memberId === record.memberId ? { ...item, ...record } : item)
        : [{ ...record, id: uid() }, ...s.attendance],
    };
  }),

  addTask: (t) => set((s) => ({ tasks: [{ ...t, id: uid() }, ...s.tasks] })),
  updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  addTeam: (m) => set((s) => ({ team: [{ ...m, id: uid(), active: true }, ...s.team] })),
  updateTeam: (id, patch) => set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  deleteTeam: (id) => set((s) => ({ team: s.team.filter((m) => m.id !== id) })),
}));

// =====================================================
// CROSS-EMPLOYEE REAL-TIME SYNC
// Ensures all employees see the same data from PostgreSQL
// =====================================================
if (typeof window !== 'undefined') {
  // 1. Fetch immediately on app load
  setTimeout(() => {
    useStore.getState().fetchFromDb();
  }, 100);

  // 2. Refetch whenever window/tab receives focus (employee switches back)
  window.addEventListener('focus', () => {
    useStore.getState().fetchFromDb();
  });

  // 3. Refetch when network comes back online
  window.addEventListener('online', () => {
    useStore.getState().fetchFromDb();
  });

  // 4. Periodic background sync every 8 seconds across all devices/employees
  setInterval(() => {
    // Only sync if tab is visible (saves bandwidth when tab is in background)
    if (!document.hidden) {
      useStore.getState().fetchFromDb();
    }
  }, 8000);

  // 5. Also sync when tab becomes visible after being hidden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      useStore.getState().fetchFromDb();
    }
  });
}