import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import LeadsPage from './pages/leads/LeadsPage';
import EventsPage from './pages/events/EventsPage';
import PackagesPage from './pages/packages/PackagesPage';
import ContractsPage from './pages/contracts/ContractsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import TeamPage from './pages/team/TeamPage';
import TasksPage from './pages/tasks/TasksPage';
import DeliverablesPage from './pages/deliverables/DeliverablesPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

// IPC Studios Dedicated Pages
import AllProjectsPage from './pages/projects/AllProjectsPage';
import WeddingProjectsPage from './pages/wedding/WeddingProjectsPage';
import WeddingClientsPage from './pages/wedding/WeddingClientsPage';
import WeddingPaymentsPage from './pages/wedding/WeddingPaymentsPage';
import WeddingDeliverablesPage from './pages/wedding/WeddingDeliverablesPage';

import FashionProjectsPage from './pages/fashion/FashionProjectsPage';
import FashionClientsPage from './pages/fashion/FashionClientsPage';
import FashionModelsPage from './pages/fashion/FashionModelsPage';
import FashionGarmentsPage from './pages/fashion/FashionGarmentsPage';
import FashionBookingsPage from './pages/fashion/FashionBookingsPage';
import FashionPaymentsPage from './pages/fashion/FashionPaymentsPage';
import FashionDeliverablesPage from './pages/fashion/FashionDeliverablesPage';

import GlobalPaymentsPage from './pages/finance/GlobalPaymentsPage';
import ExpensesPage from './pages/finance/ExpensesPage';
import AttendancePage from './pages/team/AttendancePage';
import TeamBookingPage from './pages/team/TeamBookingPage';
import CalendarPage from './pages/calendar/CalendarPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Main & CRM */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/clients" element={<CustomersPage />} />
              <Route path="/clients/:id" element={<CustomerDetailPage />} />
              <Route path="/leads" element={<LeadsPage />} />

              {/* Projects & Schedule */}
              <Route path="/projects" element={<AllProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventsPage />} />

              {/* Wedding Shoot Domain */}
              <Route path="/wedding/projects" element={<WeddingProjectsPage />} />
              <Route path="/wedding/clients" element={<WeddingClientsPage />} />
              <Route path="/wedding/packages" element={<PackagesPage />} />
              <Route path="/wedding/contracts" element={<ContractsPage />} />
              <Route path="/wedding/payments" element={<WeddingPaymentsPage />} />
              <Route path="/wedding/deliverables" element={<WeddingDeliverablesPage />} />

              {/* Studio Fashion Domain */}
              <Route path="/fashion/projects" element={<FashionProjectsPage />} />
              <Route path="/fashion/clients" element={<FashionClientsPage />} />
              <Route path="/fashion/models" element={<FashionModelsPage />} />
              <Route path="/fashion/garments" element={<FashionGarmentsPage />} />
              <Route path="/fashion/bookings" element={<FashionBookingsPage />} />
              <Route path="/fashion/payments" element={<FashionPaymentsPage />} />
              <Route path="/fashion/deliverables" element={<FashionDeliverablesPage />} />

              {/* Team & Operations */}
              <Route path="/team" element={<TeamPage />} />
              <Route path="/employees" element={<TeamPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/team-booking" element={<TeamBookingPage />} />

              {/* Finance & Invoices */}
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/finance/payments" element={<GlobalPaymentsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />

              {/* Preserved Studio Features */}
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/:id" element={<ContractsPage />} />
              <Route path="/deliverables" element={<DeliverablesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px', borderRadius: '10px' },
        }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
