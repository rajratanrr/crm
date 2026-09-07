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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/:id" element={<ContractsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/tasks" element={<TasksPage />} />
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
