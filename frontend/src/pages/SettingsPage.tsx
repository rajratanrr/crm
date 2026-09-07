import { useEffect, useState } from 'react';
import {
  UserPlus,
  Shield,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  KeyRound,
  Copy,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { userAccountApi } from '../services/api';
import { getInitials } from '../lib/utils';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const roles = [
  { value: 'MANAGER', label: 'Studio Manager', desc: 'Full operational access to shoots, clients & teams' },
  { value: 'PHOTOGRAPHER', label: 'Lead Photographer', desc: 'Shoot schedules, client details & deliverables' },
  { value: 'VIDEOGRAPHER', label: 'Videographer / Cinematographer', desc: 'Events, shoot assignments & video assets' },
  { value: 'EDITOR', label: 'Editor / Retoucher', desc: 'Post-production tasks, lookbooks & albums' },
  { value: 'SALES', label: 'Sales & Client Relations', desc: 'Leads, customer onboarding & packages' },
  { value: 'ACCOUNTANT', label: 'Finance & Accounts', desc: 'Payments, invoices & studio expenses' },
];

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string; name: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PHOTOGRAPHER',
    phone: '',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await userAccountApi.getAll();
      setUsers(data.data || []);
    } catch (err) {
      console.error('Failed to load user accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please enter name, email, and password');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await userAccountApi.create(form);
      toast.success(`Account created for ${form.name}!`);
      setCreatedCredentials({ email: form.email, pass: form.password, name: form.name });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'PHOTOGRAPHER', phone: '' });
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user account');
    }
  };

  const handleToggle = async (userId: string) => {
    try {
      await userAccountApi.toggleStatus(userId);
      toast.success('User status updated');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own logged-in account');
      return;
    }
    if (!confirm(`Are you sure you want to remove login access for ${userName}?`)) return;

    try {
      await userAccountApi.delete(userId);
      toast.success('Account removed');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Settings & User Access
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/30">
            Studio Administration
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage system configurations, your profile, and employee login credentials for Photo Fashion Studio CRM
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#C59B27] to-[#9A7318] text-white flex items-center justify-center text-xl font-bold shadow-md shadow-[#C59B27]/20 flex-shrink-0">
              {getInitials(currentUser?.name || 'Admin')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{currentUser?.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{currentUser?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Phone: {currentUser?.phone || 'Not provided'}
              </p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1 sm:text-right">
            <p className="font-semibold text-gray-900">Photo Fashion Studio CRM v2.0</p>
            <p className="text-emerald-600 font-medium flex items-center gap-1 sm:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> PostgreSQL Database Connected
            </p>
            <p className="text-gray-400">Port 5001 &bull; Dual Domain Architecture</p>
          </div>
        </div>
      </div>

      {/* Success Banner if user was just created */}
      {createdCredentials && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Employee Login Credentials Created Successfully!
            </p>
            <p className="text-xs text-emerald-700">
              Share these details with <strong>{createdCredentials.name}</strong> so they can log into the website:
            </p>
            <div className="mt-2 bg-white/90 p-3 rounded-lg border border-emerald-300 font-mono text-xs text-gray-800 space-y-1 inline-block">
              <p><strong>Website Login URL:</strong> http://localhost:5173/login</p>
              <p><strong>Email / Username:</strong> {createdCredentials.email}</p>
              <p><strong>Temporary Password:</strong> {createdCredentials.pass}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(`IPC Studios CRM Login:\nURL: http://localhost:5173/login\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.pass}`)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Details
            </button>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Employee Login Accounts Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C59B27]" />
              Employee Website Login Accounts
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Create email & password logins to grant staff members access to the CRM
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C59B27] hover:bg-[#B3891F] text-white rounded-xl text-xs font-semibold shadow-sm shadow-[#C59B27]/20 transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Add Employee Login
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No employee login accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email (Login ID)</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="text-[10px] text-[#9A7318] bg-[#FAF5EB] px-1.5 py-0.2 rounded font-medium border border-[#C59B27]/20">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium font-mono text-[11.5px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {u.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {u.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => !isCurrent && handleToggle(u.id)}
                          disabled={isCurrent}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          } ${isCurrent ? 'cursor-default opacity-80' : 'hover:opacity-80 cursor-pointer'}`}
                          title={isCurrent ? 'Your active account' : 'Click to toggle status'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete user account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions Card */}
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-950">
          <KeyRound className="w-4 h-4 text-[#C59B27]" />
          How Employee Website Access Works
        </div>
        <ol className="list-decimal list-inside space-y-1 text-amber-800/90 pl-1 leading-relaxed">
          <li>Click <strong>"Add Employee Login"</strong> above and fill in their name, email, role, and a secure password.</li>
          <li>The employee can then go directly to <strong>http://localhost:5173/login</strong> in their web browser.</li>
          <li>They enter the email and password you created to sign in and immediately access the CRM.</li>
          <li>You can deactivate or remove any account at any time from this table.</li>
        </ol>
      </div>

      {/* Modal: Create Employee Account */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Employee Login Account" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Employee Full Name *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="text"
                placeholder="e.g. Rahul Verma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address (Login Username) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="email"
                placeholder="e.g. rahul@studiocrm.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">The employee will type this email to log in.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password (Minimum 6 characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required
                type="password"
                placeholder="Set an initial password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Provide this password to your employee.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Studio Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27] bg-white font-medium"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.value})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              {roles.find((r) => r.value === form.role)?.desc}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#C59B27]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs bg-[#C59B27] hover:bg-[#B3891F] text-white rounded-lg font-semibold shadow-sm"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
