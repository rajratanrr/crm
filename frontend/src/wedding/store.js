import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const uid = () => Math.random().toString(36).slice(2, 10)
const today = new Date().toISOString().slice(0, 10)

const seedClients = [
  { id: 'c1', brideName: 'Ananya', groomName: 'Rohan', phone: '+91 98765 43210', email: 'ananya@mail.com', weddingDate: '2026-02-14', venue: 'Taj Palace, Delhi', createdAt: today },
  { id: 'c2', brideName: 'Priya',   groomName: 'Arjun', phone: '+91 99887 76655', email: 'priya@mail.com',  weddingDate: '2026-03-22', venue: 'Umaid Bhawan, Jodhpur', createdAt: today },
  { id: 'c3', brideName: 'Sneha',   groomName: 'Vikram',phone: '+91 90000 11223', email: 'sneha@mail.com',  weddingDate: '2026-05-08', venue: 'Leela Palace, Udaipur', createdAt: today },
]

const seedLeads = [
  { id: 'l1', name: 'Kavya & Aditya',  phone: '+91 97654 32109', weddingDate: '2026-11-12', location: 'Jaipur',      source: 'Instagram', status: 'NEW',              budget: 350000, assignedTo: 'Neha' },
  { id: 'l2', name: 'Meera & Kabir',   phone: '+91 96543 21098', weddingDate: '2026-12-05', location: 'Goa',         source: 'Website',   status: 'CONTACTED',         budget: 500000, assignedTo: 'Neha' },
  { id: 'l3', name: 'Riya & Sameer',   phone: '+91 95432 10987', weddingDate: '2027-01-18', location: 'Mumbai',      source: 'Referral',  status: 'PROPOSAL_SENT',     budget: 750000, assignedTo: 'Rahul' },
  { id: 'l4', name: 'Tanvi & Ishaan',  phone: '+91 94321 09876', weddingDate: '2026-10-30', location: 'Delhi',       source: 'Wedding Wire', status: 'NEGOTIATION',   budget: 400000, assignedTo: 'Rahul' },
  { id: 'l5', name: 'Nisha & Varun',   phone: '+91 93210 98765', weddingDate: '2026-09-15', location: 'Chandigarh',  source: 'Instagram', status: 'BOOKED',           budget: 600000, assignedTo: 'Neha' },
]

const seedProjects = [
  { id: 'p1', name: 'Ananya & Rohan Wedding', clientId: 'c1', totalBudget: 450000, amountPaid: 150000, status: 'SHOOTING', weddingDate: '2026-02-14', venue: 'Taj Palace, Delhi',
    deliverables: [
      { id: 'd1', name: 'Wedding Album',   status: 'EDITING',           dueDate: '2026-04-15' },
      { id: 'd2', name: 'Highlight Film',  status: 'CLIENT_SELECTION',  dueDate: '2026-04-01' },
      { id: 'd3', name: 'Teaser Reel',     status: 'DELIVERED',         dueDate: '2026-03-01' },
    ],
    events: [
      { id: 'e1', name: 'Haldi',   date: '2026-02-11', startTime: '10:00', endTime: '14:00', venue: 'Family Home',    team: ['Rahul'] },
      { id: 'e2', name: 'Mehndi',  date: '2026-02-12', startTime: '16:00', endTime: '21:00', venue: 'Taj Lawn',       team: ['Neha','Amit'] },
      { id: 'e3', name: 'Sangeet', date: '2026-02-13', startTime: '19:00', endTime: '23:00', venue: 'Taj Ballroom',   team: ['Rahul','Amit'] },
      { id: 'e4', name: 'Wedding', date: '2026-02-14', startTime: '06:00', endTime: '14:00', venue: 'Taj Palace',     team: ['Rahul','Neha','Amit'] },
      { id: 'e5', name: 'Reception',date:'2026-02-14', startTime: '19:00', endTime: '23:00', venue: 'Taj Ballroom',   team: ['Neha','Amit'] },
    ],
  },
  { id: 'p2', name: 'Priya & Arjun Wedding', clientId: 'c2', totalBudget: 750000, amountPaid: 375000, status: 'PLANNING', weddingDate: '2026-03-22', venue: 'Umaid Bhawan, Jodhpur',
    deliverables: [
      { id: 'd4', name: 'Pre-Wedding Shoot',  status: 'DELIVERED', dueDate: '2026-02-10' },
      { id: 'd5', name: 'Cinematic Film',     status: 'PENDING',   dueDate: '2026-06-15' },
      { id: 'd6', name: 'Photo Album',        status: 'PENDING',   dueDate: '2026-05-20' },
    ],
    events: [
      { id: 'e6', name: 'Sangeet', date: '2026-03-21', startTime: '19:00', endTime: '23:30', venue: 'Umaid Gardens', team: ['Rahul'] },
      { id: 'e7', name: 'Wedding', date: '2026-03-22', startTime: '07:00', endTime: '15:00', venue: 'Umaid Bhawan',  team: ['Rahul','Neha'] },
    ],
  },
]

const seedPayments = [
  { id: 'pay1', projectId: 'p1', amount: 100000, method: 'UPI',  date: '2025-12-10', description: 'Advance Booking',  reference: 'UPI-8891' },
  { id: 'pay2', projectId: 'p1', amount: 50000,  method: 'Bank', date: '2026-01-15', description: 'Second Installment', reference: 'NEFT-2233' },
  { id: 'pay3', projectId: 'p2', amount: 300000, method: 'Bank', date: '2025-12-20', description: 'Booking Advance',  reference: 'NEFT-1192' },
  { id: 'pay4', projectId: 'p2', amount: 75000,  method: 'Cash', date: '2026-01-28', description: 'Pre-wedding shoot',reference: 'CASH-001' },
]

const seedTeam = [
  { id: 't1', name: 'Rahul Mehta',  role: 'Lead Photographer',    type: 'PHOTOGRAPHER', email: 'rahul@pfs.com', phone: '+91 90000 11111', active: true },
  { id: 't2', name: 'Neha Sharma',  role: 'Cinematographer',      type: 'VIDEOGRAPHER', email: 'neha@pfs.com',  phone: '+91 90000 22222', active: true },
  { id: 't3', name: 'Amit Kumar',   role: 'Drone Operator',       type: 'VIDEOGRAPHER', email: 'amit@pfs.com',  phone: '+91 90000 33333', active: true },
  { id: 't4', name: 'Zara Khan',    role: 'Senior Editor',        type: 'EDITOR',       email: 'zara@pfs.com',  phone: '+91 90000 44444', active: true },
  { id: 't5', name: 'Priyanka Rao', role: 'Album Designer',       type: 'DESIGNER',     email: 'priya@pfs.com', phone: '+91 90000 55555', active: true },
]

const seedTasks = [
  { id: 'tk1', title: 'Edit Haldi Ceremony Photos', projectId: 'p1', assignee: 'Zara Khan',   priority: 'HIGH',   status: 'IN_PROGRESS', dueDate: '2026-02-25' },
  { id: 'tk2', title: 'Deliver Teaser Reel',        projectId: 'p1', assignee: 'Zara Khan',   priority: 'HIGH',   status: 'COMPLETED',   dueDate: '2026-02-20' },
  { id: 'tk3', title: 'Confirm Drone Permits',      projectId: 'p2', assignee: 'Amit Kumar',  priority: 'MEDIUM', status: 'PENDING',     dueDate: '2026-03-10' },
  { id: 'tk4', title: 'Design Sample Album Layout', projectId: 'p2', assignee: 'Priyanka Rao',priority: 'LOW',    status: 'PENDING',     dueDate: '2026-03-15' },
]

const seedExpenses = []
const seedSalaries = []
const seedAttendance = []
const seedInvoices = []
const seedPayroll = []
const seedBundles = []

export const useStore = create(
  persist(
    (set, get) => ({
      leads: seedLeads,
      clients: seedClients,
      projects: seedProjects,
      payments: seedPayments,
      expenses: seedExpenses,
      salaries: seedSalaries,
      attendance: seedAttendance,
      invoices: seedInvoices,
      payroll: seedPayroll,
      bundles: seedBundles,
      team: seedTeam,
      tasks: seedTasks,

      addLead: (lead) => set((s) => ({ leads: [{ ...lead, id: uid() }, ...s.leads] })),
      updateLead: (id, patch) => set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
      convertLeadToClient: (leadId) => {
        const lead = get().leads.find((l) => l.id === leadId)
        if (!lead) return
        const existingClient = get().clients.find((client) => client.phone === lead.phone)
        if (lead.status === 'BOOKED') return existingClient
        const [bride = '', groom = ''] = lead.name.split('&').map((x) => x.trim())
        const client = {
          id: uid(),
          brideName: bride,
          groomName: groom,
          phone: lead.phone,
          email: '',
          weddingDate: lead.weddingDate,
          venue: lead.location,
          createdAt: today,
        }
        set((s) => ({
          clients: existingClient ? s.clients : [client, ...s.clients],
          leads: s.leads.map((l) => (l.id === leadId ? { ...l, status: 'BOOKED' } : l)),
        }))
        return existingClient || client
      },

      addClient: (c) => set((s) => ({ clients: [{ ...c, id: uid(), createdAt: today }, ...s.clients] })),
      updateClient: (id, patch) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addProject: (p) => set((s) => ({ projects: [{ ...p, id: uid() }, ...s.projects] })),
      updateProject: (id, patch) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      addPayment: (pay) => {
        set((s) => ({ payments: [{ ...pay, id: uid() }, ...s.payments] }))
        const p = get().projects.find((x) => x.id === pay.projectId)
        if (p) {
          get().updateProject(p.id, { amountPaid: (p.amountPaid || 0) + Number(pay.amount) })
        }
      },
      updatePayment: (id, patch) => set((s) => ({ payments: s.payments.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)) })),
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((payment) => payment.id !== id) })),

      addInvoice: (invoice) => set((s) => ({ invoices: [{ ...invoice, id: uid() }, ...s.invoices] })),
      updateInvoice: (id, patch) => set((s) => ({ invoices: s.invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...patch } : invoice)) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((invoice) => invoice.id !== id) })),

      addExpense: (expense) => set((s) => ({ expenses: [{ ...expense, id: uid() }, ...s.expenses] })),
      updateExpense: (id, patch) => set((s) => ({ expenses: s.expenses.map((expense) => (expense.id === id ? { ...expense, ...patch } : expense)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((expense) => expense.id !== id) })),

      addSalary: (salary) => set((s) => ({ salaries: [{ ...salary, id: uid() }, ...s.salaries] })),
      updateSalary: (id, patch) => set((s) => ({ salaries: s.salaries.map((salary) => (salary.id === id ? { ...salary, ...patch } : salary)) })),
      deleteSalary: (id) => set((s) => ({ salaries: s.salaries.filter((salary) => salary.id !== id) })),
      addPayroll: (record) => set((s) => ({ payroll: [{ ...record, id: uid() }, ...s.payroll] })),
      updatePayroll: (id, patch) => set((s) => ({ payroll: s.payroll.map((record) => (record.id === id ? { ...record, ...patch } : record)) })),
      deletePayroll: (id) => set((s) => ({ payroll: s.payroll.filter((record) => record.id !== id) })),

      addBundle: (bundle) => set((s) => ({ bundles: [{ ...bundle, id: uid() }, ...s.bundles] })),
      updateBundle: (id, patch) => set((s) => ({ bundles: s.bundles.map((bundle) => (bundle.id === id ? { ...bundle, ...patch } : bundle)) })),
      deleteBundle: (id) => set((s) => ({ bundles: s.bundles.filter((bundle) => bundle.id !== id) })),
      importDeliverables: (projectId, deliverables) => set((s) => ({ projects: s.projects.map((project) => {
        if (project.id !== projectId) return project
        const existingNames = new Set((project.deliverables || []).map((item) => item.name.trim().toLowerCase()))
        const additions = deliverables.filter((item) => !existingNames.has(item.name.trim().toLowerCase())).map((item) => ({ ...item, id: uid() }))
        return { ...project, deliverables: [...(project.deliverables || []), ...additions] }
      }) })),

      setAttendance: (record) => set((s) => {
        const exists = s.attendance.some((item) => item.eventId === record.eventId && item.date === record.date && item.memberId === record.memberId)
        return { attendance: exists
          ? s.attendance.map((item) => item.eventId === record.eventId && item.date === record.date && item.memberId === record.memberId ? { ...item, ...record } : item)
          : [{ ...record, id: uid() }, ...s.attendance] }
      }),

      addTask: (t) => set((s) => ({ tasks: [{ ...t, id: uid() }, ...s.tasks] })),
      updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addTeam: (m) => set((s) => ({ team: [{ ...m, id: uid(), active: true }, ...s.team] })),
      updateTeam: (id, patch) => set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteTeam: (id) => set((s) => ({ team: s.team.filter((m) => m.id !== id) })),
    }),
    { name: 'pfs-crm-store' }
  )
)