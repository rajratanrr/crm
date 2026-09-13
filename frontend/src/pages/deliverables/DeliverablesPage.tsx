import { useEffect, useState } from 'react';
import { deliverableApi, projectApi, eventApi, formatDate } from '../../services/api';
import Modal from '../../components/ui/Modal';
import { Plus, Image, ExternalLink, Trash2, Search, Link2, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  LOOKBOOK: 'Lookbook High-Res',
  ECOM_CATALOG: 'E-commerce Web Catalog',
  CAMPAIGN_EDIT: 'Commercial Campaign Edit',
  EDITED_PHOTOS: 'Color-Graded / Retouched Stills',
  REEL: 'Social Media Reels / Teaser',
  CINEMATIC_FILM: 'Cinematic Wedding Film',
  TEASER: 'Highlight Teaser / Trailer',
  FULL_WEDDING_VIDEO: 'Full Ceremony Film',
  ALBUM: 'Flush-Mount Photo Album',
  RAW_PHOTOS: 'RAW Archival Backup',
  HIGHLIGHT_VIDEO: 'Highlight Video',
};

export default function DeliverablesPage({ domainFilter }: { domainFilter?: 'WEDDING' | 'FASHION' }) {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkModalItem, setLinkModalItem] = useState<any>(null);
  const [newLinkValue, setNewLinkValue] = useState('');

  const [form, setForm] = useState({
    type: domainFilter === 'FASHION' ? 'LOOKBOOK' : 'CINEMATIC_FILM',
    domain: domainFilter || 'WEDDING',
    targetType: 'PROJECT', // 'PROJECT' | 'EVENT'
    projectId: '',
    eventId: '',
    quantity: 1,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    deliveryLink: '',
    status: 'PENDING',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, pRes, eRes] = await Promise.all([
        deliverableApi.getAll({
          status: filter !== 'ALL' ? filter : undefined,
          domain: domainFilter || undefined,
          search: search.trim() || undefined,
        }),
        projectApi.getAll({ type: domainFilter || undefined }),
        domainFilter === 'WEDDING' || !domainFilter
          ? eventApi.getAll().catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setItems(dRes.data?.data || []);
      setProjects(pRes.data?.data || []);
      setEvents(eRes.data?.data || []);
    } catch {
      toast.error('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, domainFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

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
        type: form.type,
        domain: form.domain || domainFilter || 'WEDDING',
        quantity: Number(form.quantity) || 1,
        dueDate: form.dueDate || null,
        deliveryLink: form.deliveryLink || null,
        status: form.status,
        notes: form.notes || null,
        projectId: form.targetType === 'PROJECT' && form.projectId ? form.projectId : undefined,
        eventId: form.targetType === 'EVENT' && form.eventId ? form.eventId : undefined,
      });
      toast.success('Deliverable added');
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create deliverable');
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalItem) return;
    try {
      await deliverableApi.updateStatus(linkModalItem.id, linkModalItem.status);
      await deliverableApi.update(linkModalItem.id, { deliveryLink: newLinkValue });
      toast.success('Delivery link saved');
      setLinkModalItem(null);
      load();
    } catch {
      toast.error('Failed to save link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete deliverable?')) return;
    try {
      await deliverableApi.delete(id);
      toast.success('Deliverable deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const pageTitle =
    domainFilter === 'WEDDING'
      ? 'Wedding Shoot Deliverables'
      : domainFilter === 'FASHION'
      ? 'Studio Fashion Deliverables'
      : 'All Deliverables';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {domainFilter === 'FASHION'
              ? 'Track lookbook exports, e-commerce retouched batches, and Google Drive delivery links'
              : domainFilter === 'WEDDING'
              ? 'Track highlight teasers, full wedding films, edited photos, and physical albums'
              : 'Unified delivery milestones across studio fashion projects and wedding shoots'}
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              type: domainFilter === 'FASHION' ? 'LOOKBOOK' : 'CINEMATIC_FILM',
              domain: domainFilter || 'WEDDING',
              targetType: 'PROJECT',
              projectId: projects[0]?.id || '',
              eventId: events[0]?.id || '',
              quantity: 1,
              dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
              deliveryLink: '',
              status: 'PENDING',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Deliverable
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap bg-white p-1.5 rounded-xl border border-gray-100 shadow-xs">
          {['ALL', 'PENDING', 'IN_PRODUCTION', 'READY', 'DELIVERED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === s ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by project, client, or link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-[#C59B27]"
          />
        </form>
      </div>

      {/* Deliverables Table */}
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
                  <th className="py-3 px-4">Project / Client</th>
                  {!domainFilter && <th className="py-3 px-4">Domain</th>}
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Target Due Date</th>
                  <th className="py-3 px-4">Delivery Link</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((d: any) => {
                  const clientName =
                    d.project?.customer?.companyName ||
                    d.project?.brand ||
                    d.project?.customer?.fullName ||
                    d.event?.customer?.fullName ||
                    '';
                  const titleName = d.project?.name || d.event?.eventName || 'General';

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 block">
                          {DELIVERABLE_TYPE_LABELS[d.type] || d.type?.replace(/_/g, ' ')}
                        </span>
                        {d.notes && <div className="text-xs text-gray-400 font-normal mt-0.5">{d.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-gray-800 block">{titleName}</span>
                        {clientName && <span className="text-gray-400">{clientName}</span>}
                      </td>
                      {!domainFilter && (
                        <td className="py-3.5 px-4 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              d.domain === 'FASHION'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {d.domain || 'WEDDING'}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-xs text-gray-600">{d.quantity}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {d.dueDate ? formatDate(d.dueDate) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {d.deliveryLink ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={d.deliveryLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#B8860B] hover:underline font-semibold"
                            >
                              Open Link <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => {
                                setLinkModalItem(d);
                                setNewLinkValue(d.deliveryLink || '');
                              }}
                              className="text-gray-400 hover:text-gray-600 p-0.5"
                              title="Edit link"
                            >
                              ✏️
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setLinkModalItem(d);
                              setNewLinkValue('');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                          >
                            <Link2 className="w-3 h-3" /> Add Link
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={d.status}
                          onChange={(e) => handleStatusChange(d.id, e.target.value)}
                          className={`text-xs font-semibold border rounded-lg px-2.5 py-1 outline-none ${
                            d.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : d.status === 'READY'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : d.status === 'IN_PRODUCTION'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="IN_PRODUCTION">IN PRODUCTION</option>
                          <option value="READY">READY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete deliverable"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Image className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#C59B27]" />
            <p className="text-base font-semibold text-gray-700">No deliverables scheduled</p>
            <p className="text-xs text-gray-400 mt-1">
              Add production deliverables and client delivery links.
            </p>
          </div>
        )}
      </div>

      {/* Add Deliverable Modal */}
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
                ) : domainFilter === 'WEDDING' ? (
                  <>
                    <option value="CINEMATIC_FILM">Cinematic Wedding Film</option>
                    <option value="TEASER">Highlight Teaser / Trailer</option>
                    <option value="FULL_WEDDING_VIDEO">Full Wedding Ceremony Film</option>
                    <option value="ALBUM">Luxury Flush-Mount Photo Album</option>
                    <option value="EDITED_PHOTOS">Color-Graded High-Res Photos</option>
                    <option value="RAW_PHOTOS">RAW Archival Backup Drive</option>
                  </>
                ) : (
                  <>
                    <option value="LOOKBOOK">Lookbook High-Res (Fashion)</option>
                    <option value="ECOM_CATALOG">E-commerce Web Catalog (Fashion)</option>
                    <option value="CAMPAIGN_EDIT">Commercial Campaign Edit (Fashion)</option>
                    <option value="CINEMATIC_FILM">Cinematic Wedding Film</option>
                    <option value="TEASER">Highlight Teaser / Reel</option>
                    <option value="FULL_WEDDING_VIDEO">Full Wedding Ceremony Film</option>
                    <option value="ALBUM">Flush-Mount Photo Album</option>
                    <option value="EDITED_PHOTOS">Color-Graded / Retouched Photos</option>
                    <option value="RAW_PHOTOS">RAW Archival Backup Drive</option>
                    <option value="REEL">Social Media Reels</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Link to Project {events.length > 0 && '/ Event'}
              </label>
              {events.length > 0 && domainFilter === 'WEDDING' ? (
                <div className="space-y-2">
                  <div className="flex gap-3 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.targetType === 'PROJECT'}
                        onChange={() => setForm({ ...form, targetType: 'PROJECT' })}
                      />
                      Project
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.targetType === 'EVENT'}
                        onChange={() => setForm({ ...form, targetType: 'EVENT' })}
                      />
                      Event
                    </label>
                  </div>
                  {form.targetType === 'PROJECT' ? (
                    <select
                      value={form.projectId}
                      onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.brand ? `(${p.brand})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={form.eventId}
                      onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
                    >
                      <option value="">-- Select Event --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.eventName} ({ev.customer?.fullName || 'Client'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#C59B27]"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.brand ? `(${p.brand})` : p.customer?.companyName ? `(${p.customer.companyName})` : ''}
                    </option>
                  ))}
                </select>
              )}
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Link (Google Drive / Gallery)</label>
            <input
              type="text"
              value={form.deliveryLink}
              onChange={(e) => setForm({ ...form, deliveryLink: e.target.value })}
              placeholder="https://drive.google.com/drive/folders/... or client gallery"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Specifications</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. 4K ProRes export, 300 DPI print ready, clean background"
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

      {/* Edit Link Modal */}
      {linkModalItem && (
        <Modal
          isOpen={Boolean(linkModalItem)}
          onClose={() => setLinkModalItem(null)}
          title={`Delivery Link — ${linkModalItem.type?.replace(/_/g, ' ')}`}
        >
          <form onSubmit={handleSaveLink} className="space-y-4">
            <p className="text-xs text-gray-500">
              Paste the Google Drive, Dropbox, or client portal link for this deliverable:
            </p>
            <div>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/..."
                value={newLinkValue}
                onChange={(e) => setNewLinkValue(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#C59B27]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setLinkModalItem(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#C59B27] hover:bg-[#b58c1e] text-white rounded-xl shadow-sm transition-all"
              >
                Save Link
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
