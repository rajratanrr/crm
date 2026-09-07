import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Heart, Shirt } from 'lucide-react';
import { customerApi } from '../../services/api';
import { formatCurrency } from '../../lib/utils';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function CustomersPage({ domainFilter }: { domainFilter?: 'WEDDING' | 'FASHION' }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WEDDING' | 'FASHION'>(domainFilter || 'ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    source: 'Instagram',
    address: '',
    clientType: domainFilter || 'WEDDING',
    companyName: '',
    notes: '',
  });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await customerApi.getAll({
        search,
        clientType: domainFilter ? domainFilter : activeTab !== 'ALL' ? activeTab : undefined,
      });
      setCustomers(data.data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, activeTab, domainFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      toast.error('Name and Phone are required');
      return;
    }
    try {
      await customerApi.create(form);
      toast.success('Client created successfully!');
      setShowModal(false);
      setForm({
        fullName: '',
        phone: '',
        email: '',
        city: '',
        source: 'Instagram',
        address: '',
        clientType: domainFilter || 'WEDDING',
        companyName: '',
        notes: '',
      });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    }
  };

  const pageTitle = domainFilter === 'WEDDING'
    ? 'Wedding Clients'
    : domainFilter === 'FASHION'
    ? 'Fashion Clients & Brands'
    : 'All Clients';

  const pageDesc = domainFilter === 'WEDDING'
    ? 'Couples, families, and wedding organizers'
    : domainFilter === 'FASHION'
    ? 'Fashion houses, apparel brands, and agency accounts'
    : 'Master client directory across Wedding Shoot and Studio Fashion';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pageDesc}</p>
        </div>
        <button
          onClick={() => {
            setForm((f) => ({ ...f, clientType: domainFilter || 'WEDDING' }));
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Filter Tabs if global */}
      {!domainFilter && (
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-xs w-fit">
          {[
            { id: 'ALL', label: 'All Clients' },
            { id: 'WEDDING', label: 'Wedding Clients' },
            { id: 'FASHION', label: 'Fashion Clients' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/40'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-sm focus-within:border-[#C59B27] transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by name, brand, phone, email..."
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
        ) : customers.length === 0 ? (
          <EmptyState
            title="No clients found"
            description="Add your first client to get started"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Projects</th>
                  <th className="py-3 px-4 text-right">Contract Value</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-900">{c.fullName}</p>
                      {c.companyName ? (
                        <p className="text-xs text-purple-600 font-medium">{c.companyName}</p>
                      ) : (
                        <p className="text-[11px] text-gray-400 font-mono">{c.customerCode}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 ${
                          c.clientType === 'FASHION'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.clientType === 'FASHION' ? (
                          <>
                            <Shirt className="w-3 h-3 text-purple-600" /> Fashion
                          </>
                        ) : (
                          <>
                            <Heart className="w-3 h-3 text-amber-600" /> Wedding
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">{c.phone}</td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">{c.city || '-'}</td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      {(c._count?.projects || 0) + (c._count?.events || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(c.totalContractValue || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(c.totalPaid || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                      {formatCurrency(c.remainingAmount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={domainFilter === 'FASHION' ? 'Add Fashion Client / Brand' : 'Add Client'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {!domainFilter && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Domain</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clientType: 'WEDDING' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    form.clientType === 'WEDDING'
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Heart className="w-4 h-4 text-amber-600" /> Wedding Client
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clientType: 'FASHION' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    form.clientType === 'FASHION'
                      ? 'border-purple-400 bg-purple-50 text-purple-800'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Shirt className="w-4 h-4 text-purple-600" /> Fashion Brand
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {form.clientType === 'FASHION' ? 'Contact Person Name *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Aryan Malhotra"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            {form.clientType === 'FASHION' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand / Company Name</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Vogue India / Sabyasachi"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai / Chandigarh"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27] bg-white"
              >
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral / Word of Mouth</option>
                <option value="Website">Website</option>
                <option value="Google">Google Search</option>
                <option value="Fashion Agency">Fashion Agency</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Client preferences, requirements..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all"
            >
              Save Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
