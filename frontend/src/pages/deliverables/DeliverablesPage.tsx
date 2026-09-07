import { useEffect, useState } from 'react';
import { deliverableApi, projectApi, eventApi, formatDate } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { Plus, Image, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliverablesPage({ domainFilter }: { domainFilter?: 'WEDDING' | 'FASHION' }) {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    type: domainFilter === 'FASHION' ? 'LOOKBOOK' : 'CINEMATIC_FILM',
    domain: domainFilter || 'WEDDING',
    projectId: '',
    quantity: 1,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    deliveryLink: '',
    status: 'PENDING',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        deliverableApi.getAll(filter !== 'ALL' ? { status: filter } : {}),
        projectApi.getAll({ type: domainFilter || undefined }),
      ]);
      const data = dRes.data.data;
      const filtered = domainFilter
        ? data.filter((d: any) => d.domain === domainFilter || d.project?.projectType === domainFilter)
        : data;
      setItems(filtered);
      setProjects(pRes.data.data);
    } catch {
      toast.error('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, domainFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await deliverableApi.updateStatus(id, status);
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await deliverableApi.create({
        ...form,
        quantity: Number(form.quantity),
        projectId: form.projectId || null,
      });
      toast.success('Deliverable added');
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete deliverable?')) return;
    try {
      await deliverableApi.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const pageTitle = domainFilter === 'WEDDING'
    ? 'Wedding Shoot Deliverables'
    : domainFilter === 'FASHION'
    ? 'Studio Fashion Deliverables'
    : 'All Deliverables';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {domainFilter === 'FASHION'
              ? 'Track lookbook exports, e-commerce retouched batches, and campaign delivery links'
              : 'Track highlight teasers, full wedding films, edited photos, and physical albums'}
          </p>
        </div>
        <button
          onClick={() => {
            setForm((f) => ({
              ...f,
              domain: domainFilter || 'WEDDING',
              projectId: projects[0]?.id || '',
            }));
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Deliverable
        </button>
      </div>

      <div className="flex gap-2 flex-wrap bg-white p-2 rounded-xl border border-gray-100 shadow-xs w-fit">
        {['ALL', 'PENDING', 'IN_PRODUCTION', 'READY', 'DELIVERED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === s
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#C59B27]/20 border-t-[#C59B27] rounded-full animate-spin" />
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Deliverable Type</th>
                  <th className="py-3 px-4">Project / Event</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Target Due Date</th>
                  <th className="py-3 px-4">Link / Assets</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {d.type?.replace(/_/g, ' ')}
                      {d.notes && <div className="text-xs text-gray-400 font-normal">{d.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700">
                      {d.project?.name || d.event?.eventName || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{d.quantity}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {d.dueDate ? formatDate(d.dueDate) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {d.deliveryLink ? (
                        <a
                          href={d.deliveryLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#B8860B] hover:underline font-medium"
                        >
                          View Assets <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.id, e.target.value)}
                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1 bg-white outline-none focus:border-[#C59B27]"
                      >
                        {['PENDING', 'IN_PRODUCTION', 'READY', 'DELIVERED'].map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Image className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No deliverables scheduled</p>
            <p className="text-xs text-gray-400 mt-1">Add production tasks and delivery milestones.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Deliverable">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                {domainFilter === 'FASHION' ? (
                  <>
                    <option value="LOOKBOOK">Lookbook High-Res</option>
                    <option value="ECOM_CATALOG">E-commerce Web Catalog</option>
                    <option value="CAMPAIGN_EDIT">Commercial Campaign Edit</option>
                    <option value="EDITED_PHOTOS">Retouched Master Stills</option>
                    <option value="REEL">Social Media Reels / Teaser</option>
                  </>
                ) : (
                  <>
                    <option value="CINEMATIC_FILM">Cinematic Wedding Film</option>
                    <option value="TEASER">Highlight Teaser / Reel</option>
                    <option value="FULL_WEDDING_VIDEO">Full Wedding Ceremony Film</option>
                    <option value="ALBUM">Luxury Flush-Mount Photo Album</option>
                    <option value="EDITED_PHOTOS">Color-Graded High-Res Photos</option>
                    <option value="RAW_PHOTOS">RAW Archival Backup Drive</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Due Date *</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Client Delivery Link</label>
            <input
              type="text"
              value={form.deliveryLink}
              onChange={(e) => setForm({ ...form, deliveryLink: e.target.value })}
              placeholder="https://client-gallery.com/album-xyz or Google Drive"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. 4K ProRes export, 300 DPI print ready"
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
              Save Deliverable
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
