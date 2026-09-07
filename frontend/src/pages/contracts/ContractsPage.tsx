import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { contractApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  useEffect(() => { contractApi.getAll({ search }).then(r => setContracts(r.data.data)).catch(()=>{}).finally(() => setLoading(false)); }, [search]);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Contracts</h2><p className="text-sm text-gray-500">Manage all studio contracts</p></div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100"><div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm"><Search className="w-4 h-4 text-gray-400 mr-2" /><input type="text" placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" /></div></div>
        {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div> :
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
          {['Contract', 'Customer', 'Project / Event', 'Package', 'Amount', 'Paid', 'Remaining', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
        </tr></thead><tbody>
          {contracts.map((c: any) => (
            <tr key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
              <td className="px-4 py-3 text-sm font-medium text-indigo-600">{c.contractNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{c.customer?.fullName}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.project?.name || c.event?.eventName || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.package?.name || '-'}</td>
              <td className="px-4 py-3 text-sm font-bold">{formatCurrency(Number(c.finalAmount))}</td>
              <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(c.totalPaid || 0)}</td>
              <td className="px-4 py-3 text-sm text-orange-600 font-medium">{formatCurrency(c.remainingAmount || 0)}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
            </tr>))}
        </tbody></table></div>}
      </div>
    </div>
  );
}
