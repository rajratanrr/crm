import { useEffect, useState } from 'react';
import { Plus, Search, IndianRupee, ChartNoAxesCombined, Trash2, Edit2, Filter } from 'lucide-react';
import { expenseApi, formatCurrency, formatDate } from '../../services/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const [form, setForm] = useState({
    category: 'Equipment Rental',
    domain: 'GENERAL',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    vendor: '',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await expenseApi.getAll({
        domain: domainFilter !== 'ALL' ? domainFilter : undefined,
        search: search || undefined,
      });
      setExpenses(data.data);
      setTotalAmount(data.summary?.totalAmount || 0);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [domainFilter, search]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm({
      category: 'Equipment Rental',
      domain: 'GENERAL',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      vendor: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e: any) => {
    setEditingExpense(e);
    setForm({
      category: e.category,
      domain: e.domain || 'GENERAL',
      amount: String(e.amount),
      expenseDate: e.expenseDate ? e.expenseDate.split('T')[0] : '',
      paymentMethod: e.paymentMethod || 'BANK_TRANSFER',
      vendor: e.vendor || '',
      description: e.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || !form.expenseDate) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      if (editingExpense) {
        await expenseApi.update(editingExpense.id, { ...form, amount: Number(form.amount) });
        toast.success('Expense updated');
      } else {
        await expenseApi.create({ ...form, amount: Number(form.amount) });
        toast.success('Expense recorded');
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseApi.delete(id);
      toast.success('Expense deleted');
      load();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Studio Operating Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track studio rent, props, camera equipment rentals, and crew logistics</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Recorded Expenses</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-xs w-fit">
        {[
          { id: 'ALL', label: 'All Expenses' },
          { id: 'WEDDING', label: 'Wedding Shoot Expenses' },
          { id: 'FASHION', label: 'Studio Fashion Expenses' },
          { id: 'GENERAL', label: 'General Studio Ops' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDomainFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              domainFilter === tab.id
                ? 'bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/40'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm w-full focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search expenses, vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{e.expenseNumber}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">{formatDate(e.expenseDate)}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {e.category}
                      {e.description && <div className="text-xs text-gray-400 font-normal">{e.description}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-gray-100 text-gray-700">
                        {e.domain}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{e.vendor || '-'}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{e.paymentMethod?.replace(/_/g, ' ')}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <ChartNoAxesCombined className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No expenses recorded</p>
            <p className="text-xs text-gray-400 mt-1">Track operational costs to see net margins.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#C59B27] hover:bg-[#b58c1e] text-white text-xs font-semibold rounded-xl transition-all"
            >
              Record First Expense
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Record Operating Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expense Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="Equipment Rental">Camera & Light Equipment Rental</option>
                <option value="Studio Maintenance & Electric">Studio Maintenance & Electricity</option>
                <option value="Styling & Wardrobe Props">Styling & Wardrobe Props</option>
                <option value="Travel & Conveyance">Crew Travel & Conveyance</option>
                <option value="Food & Catering">Catering & Shoot Refreshments</option>
                <option value="Software & Cloud Backup">Software, Adobe & Cloud Storage</option>
                <option value="Album Printing & Lab Fees">Album Printing & Photo Lab Fees</option>
                <option value="Marketing & Ads">Marketing, Meta & Instagram Ads</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Domain</label>
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="GENERAL">General Studio Ops</option>
                <option value="WEDDING">Wedding Shoot Specific</option>
                <option value="FASHION">Studio Fashion Specific</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="15000"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vendor / Payee</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g. Pro Light Rentals / Local Taxi"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details regarding shoot or invoice reference..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
