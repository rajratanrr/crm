import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Pencil, Trash2, ChevronDown, Check } from 'lucide-react'
import { useStore } from '../store'

const STAGES = ['NEW','CONTACTED','FOLLOW_UP','MEETING_SCHEDULED','PROPOSAL_SENT','NEGOTIATION','BOOKED','LOST']

const stageStyle = {
  NEW: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-blue-50 text-blue-700',
  FOLLOW_UP: 'bg-amber-50 text-amber-700',
  MEETING_SCHEDULED: 'bg-purple-50 text-purple-700',
  PROPOSAL_SENT: 'bg-indigo-50 text-indigo-700',
  NEGOTIATION: 'bg-orange-50 text-orange-700',
  BOOKED: 'bg-emerald-50 text-emerald-700',
  LOST: 'bg-rose-50 text-rose-700',
}

export default function Leads() {
  const { leads, team, addLead, updateLead, deleteLead, convertLeadToClient } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState({ name: '', phone: '', weddingDate: '', location: '', source: 'Instagram', budget: '', assignedTo: '' })
  const [customSource, setCustomSource] = useState('')
  const [assignedOpen, setAssignedOpen] = useState(false)
  const [assignedMembers, setAssignedMembers] = useState([])

  const filtered = filter === 'ALL' ? leads : leads.filter((l) => l.status === filter)

  const resetForm = () => {
    setForm({ name: '', phone: '', weddingDate: '', location: '', source: 'Instagram', budget: '', assignedTo: '' })
    setCustomSource('')
    setAssignedMembers([])
    setAssignedOpen(false)
  }

  const openNew = () => {
    setEditing(null)
    resetForm()
    setOpen(true)
  }

  const openEdit = (lead) => {
    const standardSources = ['Instagram', 'Meta', 'Website', 'Referral', 'Wedding Wire', 'Walk-in', 'Custom']
    setEditing(lead)
    setForm({ ...lead, source: standardSources.includes(lead.source) ? lead.source : 'Custom', budget: lead.budget || '' })
    setCustomSource(standardSources.includes(lead.source) ? '' : lead.source)
    setAssignedMembers(lead.assignedTo ? lead.assignedTo.split(',').map((name) => name.trim()).filter(Boolean) : [])
    setOpen(true)
  }

  const closeForm = () => {
    setOpen(false)
    setEditing(null)
    resetForm()
  }

  const handleSave = () => {
    if (!form.name || !form.phone || (form.source === 'Custom' && !customSource.trim())) return
    const payload = { ...form, source: form.source === 'Custom' ? customSource.trim() : form.source, budget: Number(form.budget) || 0, assignedTo: assignedMembers.join(', ') }
    if (editing) updateLead(editing.id, payload)
    else addLead({ ...payload, status: 'NEW' })
    closeForm()
  }

  const handleDelete = (lead) => {
    if (window.confirm(`Delete lead ${lead.name}? This action cannot be undone.`)) deleteLead(lead.id)
  }

  const toggleAssignedMember = (name) => {
    setAssignedMembers((current) => {
      const next = current.includes(name) ? current.filter((member) => member !== name) : [...current, name]
      setForm((previous) => ({ ...previous, assignedTo: next.join(', ') }))
      return next
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Track and convert wedding enquiries into bookings.</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={15}/> New Lead</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter==='ALL' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}>
          All · {leads.length}
        </button>
        {STAGES.map((s) => {
          const count = leads.filter((l) => l.status === s).length
          return (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter===s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}>
              {s.replace(/_/g,' ')} · {count}
            </button>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Wedding Date</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Budget</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((l) => (
                  <motion.tr key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-gray-50 hover:bg-brand-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900">{l.name}</div>
                      {l.assignedTo && <div className="text-xs text-gray-500">Assigned: {l.assignedTo}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{l.phone}</td>
                    <td className="px-5 py-3.5 text-gray-600">{l.weddingDate || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{l.location || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium">₹{(l.budget||0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5"><span className="text-xs text-gray-500">{l.source}</span></td>
                    <td className="px-5 py-3.5">
                      <select value={l.status} onChange={(e) => updateLead(l.id, { status: e.target.value })} className={`badge ${stageStyle[l.status]} border-0 cursor-pointer focus:outline-none`}>
                        {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(l)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg mr-1" title="Edit lead" aria-label={`Edit ${l.name}`}><Pencil size={15}/></button>
                      <button onClick={() => handleDelete(l)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg mr-2" title="Delete lead" aria-label={`Delete ${l.name}`}><Trash2 size={15}/></button>
                      <button onClick={() => convertLeadToClient(l.id)} disabled={l.status === 'BOOKED'} className={`text-xs font-semibold ${l.status === 'BOOKED' ? 'text-gray-400 cursor-not-allowed' : 'text-brand-600 hover:text-brand-800'}`}>{l.status === 'BOOKED' ? 'Converted' : 'Convert →'}</button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-16 text-center"><div className="text-gray-400 text-sm">No leads found in this stage.</div></div>}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeForm}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white rounded-2xl w-full max-w-lg shadow-pop max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{editing ? 'Edit Lead' : 'New Lead'}</h3>
                <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close lead form"><X size={16}/></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="label">Couple / Client Name *</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g., Ananya & Rohan" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+91 …" /></div>
                  <div><label className="label">Wedding Date</label><input type="date" className="input" value={form.weddingDate} onChange={(e) => setForm({...form, weddingDate: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Location</label><input className="input" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="City" /></div>
                  <div><label className="label">Source</label><div className="flex gap-2"><select className="input" value={form.source} onChange={(e) => setForm({...form, source: e.target.value})}>{['Instagram','Meta','Website','Referral','Wedding Wire','Walk-in','Custom'].map(s => <option key={s}>{s}</option>)}</select><button type="button" onClick={() => setForm({...form, source: 'Custom'})} className="btn-outline px-3 shrink-0" title="Type a custom source">Type</button></div>{form.source === 'Custom' && <input className="input mt-2" value={customSource} onChange={(e) => setCustomSource(e.target.value)} placeholder="Type lead source" autoFocus />}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Expected Budget</label><input className="input" type="number" value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})} placeholder="₹" /></div>
                  <div className="relative"><label className="label">Assigned To</label><button type="button" onClick={() => setAssignedOpen(!assignedOpen)} className="input flex items-center justify-between text-left"><span className={assignedMembers.length ? 'text-gray-700' : 'text-gray-400'}>{assignedMembers.length ? `${assignedMembers.length} member${assignedMembers.length === 1 ? '' : 's'} selected` : 'Select team members'}</span><ChevronDown size={16} className="text-gray-400" /></button>{assignedOpen && <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-card p-2 max-h-44 overflow-y-auto">{team.map((member) => { const selected = assignedMembers.includes(member.name); return <label key={member.id} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-brand-50 cursor-pointer text-sm text-gray-700"><input type="checkbox" checked={selected} onChange={() => toggleAssignedMember(member.name)} className="sr-only" /><span className={`w-4 h-4 rounded border flex items-center justify-center ${selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300'}`}>{selected && <Check size={12} />}</span><span>{member.name}</span></label> })}</div>}{assignedMembers.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{assignedMembers.map((member) => <span key={member} className="badge bg-brand-50 text-brand-700">{member}</span>)}</div>}</div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
                <button onClick={closeForm} className="btn-outline">Cancel</button>
                <button onClick={handleSave} className="btn-primary">{editing ? 'Save Changes' : 'Save Lead'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}