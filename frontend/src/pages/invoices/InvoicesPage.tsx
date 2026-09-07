import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { invoiceApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => { invoiceApi.getAll({ search }).then(r => setInvoices(r.data.data)).catch(()=>{}).finally(() => setLoading(false)); }, [search]);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">Invoices</h2><p className="text-sm text-gray-500">All generated invoices</p></div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100"><div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm"><Search className="w-4 h-4 text-gray-400 mr-2" /><input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full" /></div></div>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-100">
          {['Invoice #', 'Customer', 'Contract', 'Issue Date', 'Due Date', 'Total', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
        </tr></thead><tbody>
          {invoices.map((i: any) => (
            <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-indigo-600">{i.invoiceNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{i.customer?.fullName}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{i.contract?.contractNumber || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(i.issueDate)}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{i.dueDate ? formatDate(i.dueDate) : '-'}</td>
              <td className="px-4 py-3 text-sm font-bold">{formatCurrency(Number(i.total))}</td>
              <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
            </tr>))}
        </tbody></table></div>
      </div>
    </div>
  );
}
