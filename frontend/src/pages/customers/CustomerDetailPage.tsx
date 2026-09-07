import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';
import { customerApi, interactionApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';
import KPICard from '../../components/ui/KPICard';

export default function CustomerDetailPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.getOne(id!).then(r => setCustomer(r.data.data)).catch(() => navigate('/customers')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!customer) return null;

  const tabs = ['overview', 'events', 'contracts', 'payments', 'interactions'];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" /> Back to Customers</button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.fullName}</h2>
            <p className="text-sm text-gray-500 mt-1">{customer.customerCode}</p>
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {customer.email}</span>}
              {customer.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {customer.city}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total Events" value={customer._count?.events || 0} icon={<span>📅</span>} color="blue" />
        <KPICard title="Contract Value" value={formatCurrency(customer.totalContractValue || 0)} icon={<span>📄</span>} color="purple" />
        <KPICard title="Total Paid" value={formatCurrency(customer.totalPaid || 0)} icon={<span>💰</span>} color="green" />
        <KPICard title="Remaining" value={formatCurrency(customer.remainingAmount || 0)} icon={<span>⏳</span>} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-100 px-4 flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[['Phone', customer.phone], ['Alt Phone', customer.alternatePhone], ['Email', customer.email], ['City', customer.city], ['State', customer.state], ['Pincode', customer.pincode], ['Source', customer.source], ['Address', customer.address]].map(([l, v]) => (
                <div key={l as string}><p className="text-gray-500">{l}</p><p className="font-medium text-gray-900">{(v as string) || '-'}</p></div>
              ))}
            </div>
          )}
          {tab === 'events' && (
            <div className="space-y-2">
              {customer.events?.map((e: any) => (
                <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} className="flex justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div><p className="text-sm font-medium">{e.eventName}</p><p className="text-xs text-gray-500">{e.venue}</p></div>
                  <div className="text-right"><p className="text-sm">{formatDate(e.startDate)}</p><StatusBadge status={e.status} /></div>
                </div>
              ))}
              {!customer.events?.length && <p className="text-sm text-gray-400 py-8 text-center">No events</p>}
            </div>
          )}
          {tab === 'contracts' && (
            <div className="space-y-2">
              {customer.contracts?.map((c: any) => (
                <div key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} className="flex justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div><p className="text-sm font-medium">{c.contractNumber}</p><p className="text-xs text-gray-500">{c.event?.eventName}</p></div>
                  <div className="text-right"><p className="text-sm font-bold">{formatCurrency(Number(c.finalAmount))}</p><StatusBadge status={c.status} /></div>
                </div>
              ))}
            </div>
          )}
          {tab === 'payments' && (
            <div className="space-y-2">
              {customer.payments?.map((p: any) => (
                <div key={p.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <div><p className="text-sm font-medium">{formatCurrency(Number(p.amount))}</p><p className="text-xs text-gray-500">{p.paymentMethod} • {p.paymentType}</p></div>
                  <p className="text-sm text-gray-600">{formatDate(p.paymentDate)}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'interactions' && (
            <div className="space-y-2">
              {customer.interactions?.map((i: any) => (
                <div key={i.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between"><StatusBadge status={i.type} /><p className="text-xs text-gray-400">{formatDate(i.interactionDate)}</p></div>
                  <p className="text-sm font-medium mt-1">{i.subject || 'No subject'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{i.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
