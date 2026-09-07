import api from '../lib/api';

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenue: () => api.get('/dashboard/revenue'),
  getUpcomingEvents: () => api.get('/dashboard/upcoming-events'),
  getRecentCustomers: () => api.get('/dashboard/recent-customers'),
  getPaymentAlerts: () => api.get('/dashboard/payment-alerts'),
  getTasks: () => api.get('/dashboard/tasks'),
};

// Customers
export const customerApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
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
  getAll: () => api.get('/packages'),
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
};

// Payments
export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  delete: (id: string) => api.delete(`/payments/${id}`),
  getStats: () => api.get('/payments/stats'),
};

// Invoices
export const invoiceApi = {
  getAll: (params?: any) => api.get('/invoices', { params }),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }),
};

// Employees
export const employeeApi = {
  getAll: () => api.get('/employees'),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
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
  updateStatus: (id: string, data: any) => api.patch(`/deliverables/${id}/status`, data),
};

// Interactions
export const interactionApi = {
  getAll: (customerId: string) => api.get(`/customers/${customerId}/interactions`),
  create: (customerId: string, data: any) => api.post(`/customers/${customerId}/interactions`, data),
  delete: (id: string) => api.delete(`/interactions/${id}`),
};

// Reports
export const reportApi = {
  getRevenue: () => api.get('/reports/revenue'),
  getCustomers: () => api.get('/reports/customers'),
  getLeads: () => api.get('/reports/leads'),
  getEvents: () => api.get('/reports/events'),
  getPackages: () => api.get('/reports/packages'),
  getPayments: () => api.get('/reports/payments'),
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
  search: (q: string) => api.get('/search', { params: { q } }),
};
