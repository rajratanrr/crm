import { useAuth } from '../lib/auth';
import { getInitials } from '../lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Settings</h2><p className="text-sm text-gray-500">Manage your profile and preferences</p></div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">{getInitials(user?.name || 'U')}</div>
          <div><p className="text-xl font-bold text-gray-900">{user?.name}</p><p className="text-sm text-gray-500">{user?.role}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-gray-500">Phone</p><p className="font-medium">{user?.phone || '-'}</p></div>
          <div><p className="text-gray-500">Role</p><p className="font-medium">{user?.role}</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Application</h3>
        <p className="text-sm text-gray-500">Studio CRM v1.0.0 • Local PostgreSQL Database</p>
      </div>
    </div>
  );
}
