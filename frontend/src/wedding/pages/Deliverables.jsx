import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, X, Pencil, Trash2, Upload, Layers } from 'lucide-react'
import { useStore } from '../store'
import { useToastStore } from '../components/Toast'

const statusColors = {
  PENDING: 'bg-slate-100 text-slate-700',
  IN_PRODUCTION: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  READY: 'bg-emerald-100 text-emerald-700',
  EDITING: 'bg-amber-100 text-amber-700',
  CLIENT_SELECTION: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
}

const statusIcons = {
  PENDING: Circle,
  IN_PRODUCTION: Clock,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  READY: CheckCircle2,
  EDITING: AlertCircle,
  CLIENT_SELECTION: Circle,
  DELIVERED: CheckCircle2,
}

const emptyForm = { projectId: '', name: '', dueDate: '', status: 'PENDING', type: 'Included', notes: '' }

const formatStatus = (status) => (status || '').replaceAll('_', ' ')

export default function Deliverables() {
  const { projects, addDeliverable, updateDeliverable, deleteDeliverable, importDeliverables, bundles = [], addBundle, updateBundle, deleteBundle } = useStore()
  const addToast = useToastStore((state) => state.addToast)
  const [open, setOpen] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [bundleOpen, setBundleOpen] = useState(false)
  const [bundleEditing, setBundleEditing] = useState(null)
  const [bundleProjectId, setBundleProjectId] = useState('')
  const fileRef = useRef(null)

  const weddingProjects = projects.filter((p) => p.projectType === 'WEDDING' || (!p.projectType && !p.name?.toLowerCase().includes('shoot')));
  const groupedByProject = weddingProjects.map((p) => ({ project: p, deliverables: p.deliverables || [] }))

  const closeModal = () => {
    setOpen(false)
    setEditingDeliverable(null)
    setForm(emptyForm)
    setError('')
    setSaving(false)
  }

  const openAddModal = () => {
    setEditingDeliverable(null)
    setForm({ ...emptyForm, projectId: weddingProjects[0]?.id || '' })
    setError('')
    setOpen(true)
  }

  const openAddModalForProject = (projectId) => {
    setEditingDeliverable(null)
    setForm({ ...emptyForm, projectId })
    setError('')
    setOpen(true)
  }

  const openEditModal = (project, deliverable) => {
    setEditingDeliverable({ projectId: project.id, id: deliverable.id })
    setForm({
      projectId: project.id,
      name: deliverable.name || deliverable.notes || '',
      dueDate: deliverable.dueDate || '',
      status: deliverable.status || 'PENDING',
      type: deliverable.type || 'Included',
      notes: deliverable.notes || '',
    })
    setError('')
    setOpen(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.projectId || !form.name.trim()) {
      setError('Name and project are required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingDeliverable) {
        // UPDATE existing deliverable via backend API
        await updateDeliverable(editingDeliverable.id, {
          name: form.name.trim(),
          notes: form.name.trim(),
          dueDate: form.dueDate || null,
          status: form.status,
          projectId: form.projectId,
        })
        addToast('Deliverable updated successfully.', 'success')
      } else {
        // CREATE new deliverable via backend API
        await addDeliverable({
          projectId: form.projectId,
          name: form.name.trim(),
          notes: form.name.trim(),
          dueDate: form.dueDate || undefined,
          status: form.status || 'PENDING',
          dbType: 'EDITED_PHOTOS',
        })
        addToast('Deliverable added successfully.', 'success')
      }
      closeModal()
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save deliverable.'
      setError(errMsg)
      console.error('Deliverable save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (projectId, deliverableId) => {
    if (!window.confirm('Delete this deliverable? This action cannot be undone.')) return
    try {
      await deleteDeliverable(deliverableId)
      addToast('Deliverable deleted.', 'success')
    } catch (err) {
      console.error('Failed to delete deliverable:', err)
      addToast('Failed to delete deliverable.', 'error')
    }
  }

  const handleImport = (event, projectId) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = String(reader.result).split(/\r?\n/).map((row) => row.trim()).filter(Boolean)
      const [header, ...data] = rows
      const columns = header?.split(',').map((value) => value.trim().toLowerCase()) || []
      const nameIndex = columns.indexOf('name') >= 0 ? columns.indexOf('name') : columns.indexOf('deliverable')
      if (nameIndex < 0) { window.alert('CSV must include a Name or Deliverable column.'); return }
      const imported = data.map((row) => row.split(',')).map((values) => ({ name: values[nameIndex]?.trim(), status: values[columns.indexOf('status')]?.trim() || 'PENDING', dueDate: values[columns.indexOf('duedate')]?.trim() || values[columns.indexOf('due date')]?.trim() || '', type: values[columns.indexOf('type')]?.trim() || 'Included', notes: values[columns.indexOf('notes')]?.trim() || '' })).filter((item) => item.name)
      if (!imported.length) { window.alert('No valid rows found. Each row needs a name.'); return }
      importDeliverables(projectId, imported)
      addToast(`Imported ${imported.length} deliverables.`, 'success')
    }
    reader.readAsText(file)
  }

  const openBundle = (projectId, bundle = null) => {
    setBundleProjectId(projectId)
    setBundleEditing(bundle)
    setBundleOpen(true)
  }

  const saveBundle = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const deliverableIds = formData.getAll('deliverables')
    const payload = { projectId: bundleProjectId, name: formData.get('name').trim(), description: formData.get('description').trim(), deliverableIds }
    if (!payload.name || !deliverableIds.length) return
    if (bundleEditing) updateBundle(bundleEditing.id, payload)
    else addBundle(payload)
    setBundleOpen(false)
    setBundleEditing(null)
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Deliverables</h1>
          <p className="text-sm text-gray-500 mt-1">Track photo albums, videos, edits and other project deliverables.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button onClick={() => fileRef.current?.click()} className="btn-outline" disabled={weddingProjects.length === 0}><Upload size={15} /> Import</button>
          <button onClick={() => openBundle(weddingProjects[0]?.id)} className="btn-outline" disabled={weddingProjects.length === 0}><Layers size={15} /> Create Bundle</button>
          <button onClick={openAddModal} className="btn-primary" disabled={weddingProjects.length === 0}><Plus size={15} /> Add Deliverable</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleImport(event, weddingProjects[0]?.id)} />
        </div>
      </div>

      <div className="space-y-6">
        {groupedByProject.map((group) => (
          <motion.div key={group.project.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 truncate min-w-0">{group.project.name}</h2>
              <div className="flex gap-1 shrink-0 flex-wrap">
                <label className="btn-ghost text-brand-600 hover:bg-brand-50 shrink-0 cursor-pointer">
                  <Upload size={14} /> Import
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleImport(event, group.project.id)} />
                </label>
                <button onClick={() => openBundle(group.project.id)} className="btn-ghost text-brand-600 hover:bg-brand-50 shrink-0"><Layers size={14} /> Bundle</button>
                <button onClick={() => openAddModalForProject(group.project.id)} className="btn-ghost text-brand-600 hover:bg-brand-50 shrink-0"><Plus size={14} /> Add</button>
              </div>
            </div>
            {group.deliverables.length > 0 ? (
              <div className="space-y-3">
                {group.deliverables.map((d) => {
                  const StatusIcon = statusIcons[d.status] || Circle
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <StatusIcon size={20} className={`shrink-0 ${(statusColors[d.status]?.split(' ')[1]) || 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{d.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                            <span className={`px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[d.status] || 'bg-gray-100 text-gray-700'}`}>
                              {formatStatus(d.status)}
                            </span>
                            {d.type && <span className="whitespace-nowrap">{d.type}</span>}
                            {d.dueDate && <span className="whitespace-nowrap">Due: {new Date(d.dueDate).toLocaleDateString('en-IN')}</span>}
                          </div>
                          {d.notes && d.notes !== d.name && <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">{d.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditModal(group.project, d)} className="p-2 text-gray-400 hover:text-brand-600 transition-colors" aria-label={`Edit ${d.name}`} title="Edit deliverable">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(group.project.id, d.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" aria-label={`Delete ${d.name}`} title="Delete deliverable">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No deliverables yet</p>
            )}
          </motion.div>
        ))}
      </div>

      {bundles.length > 0 && (
        <div className="card p-6 mt-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverable Bundles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{bundle.name}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{projects.find((project) => project.id === bundle.projectId)?.name} · {bundle.deliverableIds.length} deliverables</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openBundle(bundle.projectId, bundle)} className="p-2 text-gray-400 hover:text-brand-600" aria-label="Edit bundle"><Pencil size={15} /></button>
                    <button onClick={() => deleteBundle(bundle.id)} className="p-2 text-gray-400 hover:text-rose-600" aria-label="Delete bundle"><Trash2 size={15} /></button>
                  </div>
                </div>
                {bundle.description && <p className="text-sm text-gray-600 mt-3 break-words">{bundle.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-pop max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{editingDeliverable ? 'Edit Deliverable' : 'Add Deliverable'}</h2>
                <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-700" aria-label="Close dialog"><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label" htmlFor="deliverable-name">Deliverable Name *</label>
                  <input
                    id="deliverable-name"
                    className="input"
                    placeholder="e.g., Wedding Album"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label" htmlFor="deliverable-project">Project / Wedding *</label>
                  <select id="deliverable-project" className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">Select project</option>
                    {weddingProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="deliverable-due-date">Due Date</label>
                    <input id="deliverable-due-date" type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" htmlFor="deliverable-status">Status</label>
                    <select
                      id="deliverable-status"
                      className="input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PRODUCTION">In Production</option>
                      <option value="READY">Ready</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="deliverable-notes">Notes</label>
                  <textarea id="deliverable-notes" className="input min-h-20 resize-y" placeholder="Add any helpful details" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-ghost flex-1" disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving ? 'Saving...' : editingDeliverable ? 'Save Changes' : 'Add Deliverable'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bundleOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4" onClick={() => setBundleOpen(false)}>
            <motion.form onSubmit={saveBundle} initial={{ scale: .95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-pop max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{bundleEditing ? 'Edit Bundle' : 'Create Bundle'}</h2>
                <button type="button" onClick={() => setBundleOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div><label className="label">Bundle Name *</label><input name="name" required defaultValue={bundleEditing?.name || ''} className="input" /></div>
                <div><label className="label">Description</label><textarea name="description" defaultValue={bundleEditing?.description || ''} className="input min-h-20" /></div>
                <div>
                  <label className="label">Deliverables *</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(projects.find((project) => project.id === bundleProjectId)?.deliverables || []).map((deliverable) => (
                      <label key={deliverable.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" name="deliverables" value={deliverable.id} defaultChecked={bundleEditing?.deliverableIds?.includes(deliverable.id)} />
                        {deliverable.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setBundleOpen(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Save Bundle</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
