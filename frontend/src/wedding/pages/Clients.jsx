import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Phone, Mail, MapPin, Calendar, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient, projects } = useStore()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ brideName: '', groomName: '', phone: '', email: '', weddingDate: '', venue: '' })

  const resetForm = () => setForm({ brideName: '', groomName: '', phone: '', email: '', weddingDate: '', venue: '' })

  const openAdd = () => {
    setEditing(null)
    resetForm()
    setOpen(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setForm({ brideName: client.brideName || '', groomName: client.groomName || '', phone: client.phone || '', email: client.email || '', weddingDate: client.weddingDate || '', venue: client.venue || '' })
    setOpen(true)
  }

  const closeForm = () => {
    setOpen(false)
    setEditing(null)
    resetForm()
  }

  const save = () => {
    if (!form.brideName || !form.groomName) return
    if (editing) updateClient(editing.id, form)
    else addClient(form)
    closeForm()
  }

  const remove = (client) => {
    if (!window.confirm(`Remove ${client.brideName} & ${client.groomName}? This action cannot be undone.`)) return
    deleteClient(client.id)
    if (selected?.id === client.id) setSelected(null)
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Bride & groom profiles, contact details and history.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={15}/> Add Client</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => {
          const clientProjects = projects.filter((p) => p.clientId === c.id)
          return (
            <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} onClick={() => setSelected(c)} className="card p-5 cursor-pointer hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
                  {c.brideName[0]}{c.groomName[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{c.brideName} & {c.groomName}</div>
                  <div className="text-xs text-gray-500">{c.weddingDate || 'Date TBD'}</div>
                </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(event) => event.stopPropagation()}>
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title="Edit client" aria-label={`Edit ${c.brideName} and ${c.groomName}`}><Pencil size={15}/></button>
                  <button onClick={() => remove(c)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Remove client" aria-label={`Remove ${c.brideName} and ${c.groomName}`}><Trash2 size={15}/></button>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2"><Phone size={12}/> {c.phone}</div>
                {c.email && <div className="flex items-center gap-2"><Mail size={12}/> {c.email}</div>}
                {c.venue && <div className="flex items-center gap-2"><MapPin size={12}/> {c.venue}</div>}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">{clientProjects.length} project(s)</span>
                <span className="text-brand-600 font-semibold">View profile →</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl w-full max-w-2xl shadow-pop max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold">
                    {selected.brideName[0]}{selected.groomName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selected.brideName} & {selected.groomName}</h3>
                    <p className="text-sm text-gray-500">{selected.venue || 'Venue TBD'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1"><button onClick={() => openEdit(selected)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title="Edit client" aria-label="Edit client"><Pencil size={17}/></button><button onClick={() => remove(selected)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Remove client" aria-label="Remove client"><Trash2 size={17}/></button><button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close profile"><X size={18}/></button></div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <Info icon={<Phone size={14}/>} label="Phone" value={selected.phone} />
                <Info icon={<Mail size={14}/>} label="Email" value={selected.email || '—'} />
                <Info icon={<Calendar size={14}/>} label="Wedding Date" value={selected.weddingDate || 'TBD'} />
                <Info icon={<MapPin size={14}/>} label="Venue" value={selected.venue || 'TBD'} />
              </div>
              <div className="px-6 pb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Projects</h4>
                {projects.filter((p) => p.clientId === selected.id).map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-brand-50/50 border border-brand-100 mb-2">
                    <div className="font-medium text-sm text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">₹{p.amountPaid.toLocaleString('en-IN')} / ₹{p.totalBudget.toLocaleString('en-IN')}</div>
                  </div>
                ))}
                {projects.filter((p) => p.clientId === selected.id).length === 0 && <div className="text-sm text-gray-400 py-4">No projects yet.</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl w-full max-w-lg shadow-pop" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{editing ? 'Edit Client' : 'Add Client'}</h3>
                <button onClick={closeForm} aria-label="Close client form"><X size={16}/></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Bride Name *</label><input className="input" value={form.brideName} onChange={(e) => setForm({...form, brideName: e.target.value})} /></div>
                  <div><label className="label">Groom Name *</label><input className="input" value={form.groomName} onChange={(e) => setForm({...form, groomName: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                  <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Wedding Date</label><input type="date" className="input" value={form.weddingDate} onChange={(e) => setForm({...form, weddingDate: e.target.value})} /></div>
                  <div><label className="label">Venue</label><input className="input" value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})} /></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
                <button onClick={closeForm} className="btn-outline">Cancel</button>
                <button onClick={save} className="btn-primary">{editing ? 'Save Changes' : 'Save Client'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Info({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">{icon}</div>
      <div>
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-gray-800 font-medium">{value}</div>
      </div>
    </div>
  )
}