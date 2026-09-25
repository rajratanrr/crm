import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Mail, Phone, X, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'

const roleColor = {
  PHOTOGRAPHER: 'bg-brand-100 text-brand-800',
  VIDEOGRAPHER: 'bg-purple-100 text-purple-800',
  EDITOR: 'bg-blue-100 text-blue-800',
  DESIGNER: 'bg-amber-100 text-amber-800',
  DRONE: 'bg-cyan-100 text-cyan-800',
}

export default function Team() {
  const { team, addTeam, updateTeam, deleteTeam, projects } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', role: '', type: 'PHOTOGRAPHER', email: '', phone: '' })

  const resetForm = () => setForm({ name: '', role: '', type: 'PHOTOGRAPHER', email: '', phone: '' })
  const openAdd = () => { setEditing(null); resetForm(); setOpen(true) }
  const openEdit = (member) => { setEditing(member); setForm({ name: member.name || '', role: member.role || '', type: member.type || 'PHOTOGRAPHER', email: member.email || '', phone: member.phone || '' }); setOpen(true) }
  const closeForm = () => { setOpen(false); setEditing(null); resetForm() }

  const save = () => {
    if (!form.name) return
    if (editing) updateTeam(editing.id, form)
    else addTeam(form)
    closeForm()
  }

  const remove = (member) => { if (window.confirm(`Remove ${member.name} from the team?`)) deleteTeam(member.id) }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Photographers, cinematographers, editors and designers.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={15}/> Add Member</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {team.map((m) => {
          const assigned = projects.flatMap((p) => (p.events || []).flatMap((e) => (e.team || []).includes(m.name) ? [e] : []))
          return (
            <motion.div key={m.id} layout whileHover={{ y: -3 }} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
                  {m.name.split(' ').map((n) => n[0]).slice(0,2).join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{m.name}</div>
                  <div className="text-xs text-gray-500 truncate">{m.role}</div>
                </div>
                </div>
                <div className="flex gap-1 shrink-0"><button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg" title="Edit team member" aria-label={`Edit ${m.name}`}><Pencil size={15}/></button><button onClick={() => remove(m)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete team member" aria-label={`Delete ${m.name}`}><Trash2 size={15}/></button></div>
              </div>
              <span className={`badge ${roleColor[m.type] || 'bg-gray-100 text-gray-700'}`}>{m.type}</span>
              <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2 truncate"><Mail size={12}/> {m.email}</div>
                <div className="flex items-center gap-2"><Phone size={12}/> {m.phone}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="font-semibold text-brand-600">{assigned.length}</span> event(s) assigned
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeForm}>
            <motion.div initial={{ scale: .95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-pop" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{editing ? 'Edit Team Member' : 'Add Team Member'}</h3>
                <button onClick={closeForm} aria-label="Close team form"><X size={16}/></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Role / Title</label><input className="input" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} placeholder="e.g., Lead Photographer" /></div>
                  <div><label className="label">Type</label>
                    <select className="input" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                      {['PHOTOGRAPHER','VIDEOGRAPHER','EDITOR','DESIGNER','DRONE'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
                <button onClick={closeForm} className="btn-outline">Cancel</button>
                <button onClick={save} className="btn-primary">{editing ? 'Save Changes' : 'Add Member'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}