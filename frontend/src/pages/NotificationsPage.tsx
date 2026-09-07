import { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import { formatDateTime } from '../lib/utils';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const load = async () => { try { const { data } = await notificationApi.getAll(); setNotifications(data.data); } catch {} };
  useEffect(() => { load(); }, []);
  const markAll = async () => { await notificationApi.markAllRead(); toast.success('All marked as read'); load(); };
  const typeIcons: Record<string, string> = { info: '📢', warning: '⚠️', success: '✅', error: '❌' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Notifications</h2></div>
        <button onClick={markAll} className="px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50">Mark all as read</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.isRead ? 'bg-indigo-50/50' : ''}`}>
            <span className="text-lg">{typeIcons[n.type] || '📢'}</span>
            <div className="flex-1"><p className="text-sm font-medium text-gray-900">{n.title}</p><p className="text-xs text-gray-500 mt-0.5">{n.message}</p><p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p></div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}
