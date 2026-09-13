import api from '../lib/api';

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenue: () => api.get('/dashboard/revenue'),
  getUpcomingEvents: () => api.get('/dashboard/upcoming-events'),
  getRecentCustomers: () => api.get('/dashboard/recent-customers'),
  getRecentProjects: () => api.get('/dashboard/recent-projects'),
  getPaymentAlerts: () => api.get('/dashboard/payment-alerts'),
  getTasks: () => api.get('/dashboard/tasks'),
};

// Projects
export const projectApi = {
  getAll: (params?: any) => api.get('/projects', { params }),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  patch: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getFinancialSummary: (id: string) => api.get(`/projects/${id}/financial-summary`),
  // Project-scoped model assignments
  getModels: (projectId: string) => api.get(`/projects/${projectId}/models`),
  addModel: (projectId: string, data: any) => api.post(`/projects/${projectId}/models`, data),
  updateModel: (projectId: string, id: string, data: any) => api.patch(`/projects/${projectId}/models/${id}`, data),
  removeModel: (projectId: string, id: string) => api.delete(`/projects/${projectId}/models/${id}`),
  // Project-scoped garment requirements
  getGarments: (projectId: string) => api.get(`/projects/${projectId}/garments`),
  addGarment: (projectId: string, data: any) => api.post(`/projects/${projectId}/garments`, data),
  updateGarment: (projectId: string, id: string, data: any) => api.patch(`/projects/${projectId}/garments/${id}`, data),
  removeGarment: (projectId: string, id: string) => api.delete(`/projects/${projectId}/garments/${id}`),
  bulkGarments: (projectId: string, requirements: any[]) => api.post(`/projects/${projectId}/garments/bulk`, { requirements }),
};

// Customers / Clients
export const customerApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  bulkImport: (customers: any[]) => api.post("/customers/bulk-import", { customers }),
  getClientModels: (id: string) => api.get(`/customers/${id}/models`),
  syncClientModels: (id: string, models: any[]) => api.post(`/customers/${id}/models`, { models }),
};

// Leads
export const leadApi = {
  getAll: (params?: any) => api.get('/leads', { params }),
  getOne: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/leads/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/leads/${id}`),
};

// Events
export const eventApi = {
  getAll: (params?: any) => api.get('/events', { params }),
  getOne: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  getUpcoming: () => api.get('/events/upcoming'),
  getCalendar: (params?: any) => api.get('/events/calendar', { params }),
  addAssignment: (eventId: string, data: any) => api.post(`/events/${eventId}/assignments`, data),
  removeAssignment: (eventId: string, assignmentId: string) => api.delete(`/events/${eventId}/assignments/${assignmentId}`),
};

// Packages
export const packageApi = {
  getAll: (params?: any) => api.get('/packages', { params }),
  getOne: (id: string) => api.get(`/packages/${id}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};

// Contracts
export const contractApi = {
  getAll: (params?: any) => api.get('/contracts', { params }),
  getOne: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: string, data: any) => api.put(`/contracts/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/contracts/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/contracts/${id}`),
  addItem: (contractId: string, data: any) => api.post(`/contracts/${contractId}/items`, data),
  removeItem: (contractId: string, itemId: string) => api.delete(`/contracts/${contractId}/items/${itemId}`),
};

// Payments
export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  getFinanceSummary: (params?: any) => api.get('/payments/finance-summary', { params }),
  getStats: () => api.get('/payments/stats'),
  create: (data: any) => api.post('/payments', data),
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  patch: (id: string, data: any) => api.patch(`/payments/${id}`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
};

// Invoices
export const invoiceApi = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
};

// Employees
export const employeeApi = {
  getAll: (params?: any) => api.get('/employees', { params }),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getAvailability: (params: any) => api.get('/employees/availability', { params }),
};

// Tasks
export const taskApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Deliverables
export const deliverableApi = {
  getAll: (params?: any) => api.get('/deliverables', { params }),
  getOne: (id: string) => api.get(`/deliverables/${id}`),
  create: (data: any) => api.post('/deliverables', data),
  update: (id: string, data: any) => api.put(`/deliverables/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/deliverables/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/deliverables/${id}`),
};

// Fashion: Models
export const modelApi = {
  getAll: (params?: any) => api.get('/models', { params }),
  getOne: (id: string) => api.get(`/models/${id}`),
  create: (data: any) => api.post('/models', data),
  update: (id: string, data: any) => api.put(`/models/${id}`, data),
  patch: (id: string, data: any) => api.patch(`/models/${id}`, data),
  delete: (id: string) => api.delete(`/models/${id}`),
};

// Fashion: project-level garment requirements + model assignments (legacy query-param style, kept for compat)
export const fashionApi = {
  // Garment requirements (query-param style — legacy)
  getGarmentRequirements: (projectId: string) =>
    api.get('/fashion/garment-requirements', { params: { projectId } }),
  createGarmentRequirement: (data: { projectId: string; clothType: string; dressName: string; quantity: number }) =>
    api.post('/fashion/garment-requirements', data),
  updateGarmentRequirement: (id: string, data: Partial<{ clothType: string; dressName: string; quantity: number }>) =>
    api.patch(`/fashion/garment-requirements/${id}`, data),
  deleteGarmentRequirement: (id: string) =>
    api.delete(`/fashion/garment-requirements/${id}`),
  bulkUpsertGarmentRequirements: (projectId: string, requirements: any[]) =>
    api.post(`/fashion/garment-requirements/project/${projectId}/bulk`, { requirements }),

  // Project model assignments (query-param style — legacy)
  getProjectModels: (projectId: string) =>
    api.get('/fashion/project-models', { params: { projectId } }),
  createProjectModel: (data: { projectId: string; modelId: string; modelRate: number; notes?: string }) =>
    api.post('/fashion/project-models', data),
  updateProjectModel: (id: string, data: Partial<{ modelRate: number; notes: string }>) =>
    api.patch(`/fashion/project-models/${id}`, data),
  deleteProjectModel: (id: string) =>
    api.delete(`/fashion/project-models/${id}`),

  // Client model default assignments & rates
  getClientModels: (clientId: string) =>
    api.get(`/fashion/clients/${clientId}/models`),
  syncClientModels: (clientId: string, models: any[]) =>
    api.post(`/fashion/clients/${clientId}/models`, { models }),

  // Client financial summary
  getClientFinancialSummary: (clientId: string) =>
    api.get(`/clients/${clientId}/financial-summary`),
};

// Fashion: Garments
export const garmentApi = {
  getAll: (params?: any) => api.get('/garments', { params }),
  create: (data: any) => api.post('/garments', data),
  update: (id: string, data: any) => api.put(`/garments/${id}`, data),
  delete: (id: string) => api.delete(`/garments/${id}`),
};

// Fashion: Studio Bookings
export const bookingApi = {
  getAll: (params?: any) => api.get('/bookings', { params }),
  create: (data: any) => api.post('/bookings', data),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
};

// Attendance
export const attendanceApi = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  mark: (data: any) => api.post('/attendance', data),
  delete: (id: string) => api.delete(`/attendance/${id}`),
};

// Expenses
export const expenseApi = {
  getAll: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// Reports
export const reportApi = {
  getRevenueReport: (params?: any) => api.get('/reports/revenue', { params }),
  getCustomerReport: (params?: any) => api.get('/reports/customers', { params }),
  getLeadReport: () => api.get('/reports/leads'),
  getEventReport: (params?: any) => api.get('/reports/events', { params }),
  getPackageReport: () => api.get('/reports/packages'),
  getTeamReport: () => api.get('/reports/team'),
  getRevenue: (params?: any) => api.get('/reports/revenue', { params }),
  getCustomers: (params?: any) => api.get('/reports/customers', { params }),
  getLeads: () => api.get('/reports/leads'),
  getEvents: (params?: any) => api.get('/reports/events', { params }),
  getPackages: () => api.get('/reports/packages'),
  getTeam: () => api.get('/reports/team'),
};

// Notifications
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Search
export const searchApi = {
  global: (query: string) => api.get(`/search?q=${encodeURIComponent(query)}`),
  search: (query: string) => api.get(`/search?q=${encodeURIComponent(query)}`),
};

// Format currency
export const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Format date
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const fashionBookingApi = bookingApi;
export const interactionApi = { create: (data: any) => api.post('/customers/interaction', data) };

export const userAccountApi = {
  getAll: () => api.get("/auth/users"),
  create: (data: any) => api.post("/auth/register", data),
  toggleStatus: (id: string) => api.patch(`/auth/users/${id}/toggle`), 
  delete: (id: string) => api.delete(`/auth/users/${id}`),
};
