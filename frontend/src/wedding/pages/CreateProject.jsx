import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, Save, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { useStore } from '../store'

const emptyDeliverable = () => ({ id: Math.random().toString(36).slice(2), name: '', status: 'PENDING', dueDate: '' })
const emptySchedule = () => ({ id: Math.random().toString(36).slice(2), name: '', date: '', startTime: '', endTime: '', venue: '', team: [] })

export default function CreateProject({ onDone, project }) {
  const { clients, team: teamMembers, addProject, updateProject } = useStore()
  const [name, setName] = useState(() => project?.name || '')
  const [clientId, setClientId] = useState(() => project?.clientId || '')
  const [clientPhone, setClientPhone] = useState('')
  const [weddingDate, setWeddingDate] = useState(() => project?.weddingDate || '')
  const [venue, setVenue] = useState(() => project?.venue || '')
  const [packageCost, setPackageCost] = useState(() => String(project?.totalBudget || ''))
  const [receivedAmount, setReceivedAmount] = useState(() => String(project?.amountPaid || ''))
  const [deliverables, setDeliverables] = useState(() => project?.deliverables || [emptyDeliverable()])
  const [schedules, setSchedules] = useState(() => (project?.events || []).map((event) => ({ ...event, team: event.team || [] })))
  const [openTeamSchedule, setOpenTeamSchedule] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const updateDel = (id, patch) => setDeliverables((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const removeDel = (id) => setDeliverables((d) => d.filter((x) => x.id !== id))
  const updateSchedule = (id, patch) => setSchedules((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  const removeSchedule = (id) => setSchedules((items) => items.filter((item) => item.id !== id))
  const toggleScheduleMember = (schedule, memberName) => {
    const selected = schedule.team.includes(memberName)
    updateSchedule(schedule.id, { team: selected ? schedule.team.filter((name) => name !== memberName) : [...schedule.team, memberName] })
  }

  const cleanInputPhone = clientPhone.replace(/\D/g, '')
  const matchedClient = clients.find((c) => {
    if (!c.phone || cleanInputPhone.length < 10) return false
    const digits = String(c.phone).replace(/\D/g, '')
    return digits.endsWith(cleanInputPhone.slice(-10))
  })

  const save = async () => {
    setError('')
    if (!name.trim()) {
      setError('Please enter a project name.')
      return
    }
    if (!packageCost || Number(packageCost) < 0) {
      setError('Please enter a valid package cost.')
      return
    }

    setSaving(true)
    try {
      const cid = clientId || matchedClient?.id || ''
      const payload = {
        name: name.trim(),
        clientId: cid,
        clientPhone: cleanInputPhone.slice(-10),
        totalBudget: Number(packageCost) || 0,
        amountPaid: Number(receivedAmount) || 0,
        status: project?.status || 'CONFIRMED',
        weddingDate: weddingDate || matchedClient?.weddingDate || '',
        venue: venue || matchedClient?.venue || '',
        deliverables: deliverables.filter((d) => d.name?.trim()),
        events: schedules.filter((schedule) => schedule.name?.trim() && schedule.date).map(({ id, name: eventName, ...schedule }) => ({ id, name: eventName.trim(), ...schedule })),
      }
      if (project) await updateProject(project.id, payload)
      else await addProject(payload)
      onDone()
    } catch (err) {
      console.error('Failed to save project:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to save project. Please check database connection.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onDone} className="btn-ghost"><ArrowLeft size={15}/> Back</button>
        <button onClick={save} disabled={saving} className="btn-primary">
          <Save size={15}/> {saving ? 'Saving...' : 'Save Project'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="card p-6">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="Enter Project Name (e.g. Aditi & Rahul Wedding)"
            className="text-2xl font-bold text-gray-900 w-full border-2 border-brand-300 focus:border-brand-500 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-brand-500/15 transition-all placeholder:text-gray-300"
          />

          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Client Details</h3>
            <label className="label">Client Phone *</label>
            <div className="flex max-w-md">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm">🇮🇳 +91</span>
              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Enter 10-digit phone to match or add client"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            {matchedClient && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                ✓ Matched Client: <strong>{matchedClient.brideName} & {matchedClient.groomName}</strong>
              </motion.div>
            )}
            {!matchedClient && clients.length > 0 && (
              <div className="mt-3 max-w-md">
                <label className="label">Or choose an existing client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
                  <option value="">— Select client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brideName} {c.groomName ? `& ${c.groomName}` : ''} ({c.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="label">Wedding Date</label>
              <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Venue / City</label>
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue or Location" className="input" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
          </div>
          <div className="space-y-2">
            {deliverables.map((d) => (
              <motion.div key={d.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 items-center">
                <input value={d.name} onChange={(e) => updateDel(d.id, { name: e.target.value })} placeholder="e.g., Wedding Album, Cinematic Video" className="input flex-1 min-w-[200px]" />
                <select value={d.status} onChange={(e) => updateDel(d.id, { status: e.target.value })} className="input w-44">
                  <option value="PENDING">Included in Package</option>
                  <option value="EXTRA">Extra Charge</option>
                </select>
                <input type="date" value={d.dueDate} onChange={(e) => updateDel(d.id, { dueDate: e.target.value })} className="input w-44" />
                <button onClick={() => removeDel(d.id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete deliverable" aria-label="Delete deliverable">
                  <Trash2 size={15}/>
                </button>
              </motion.div>
            ))}
          </div>
          <button onClick={() => setDeliverables((d) => [...d, emptyDeliverable()])} className="mt-3 text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5">
            <Plus size={14}/> Add Deliverable
          </button>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Shoot Schedule</h3>
              <p className="text-xs text-gray-500 mt-1">Add shoots and events that appear in the Calendar and Attendance.</p>
            </div>
            <button onClick={() => setSchedules((items) => [...items, emptySchedule()])} className="btn-primary text-xs">
              <Plus size={13}/> Add Shoot Schedule
            </button>
          </div>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <motion.div key={schedule.id} layout className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="label">Shoot Name *</label>
                    <input className="input" value={schedule.name} onChange={(e) => updateSchedule(schedule.id, { name: e.target.value })} placeholder="e.g., Haldi / Reception" />
                  </div>
                  <div>
                    <label className="label">Date *</label>
                    <input type="date" className="input" value={schedule.date} onChange={(e) => updateSchedule(schedule.id, { date: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input" value={schedule.startTime} onChange={(e) => updateSchedule(schedule.id, { startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input" value={schedule.endTime} onChange={(e) => updateSchedule(schedule.id, { endTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Venue</label>
                    <input className="input" value={schedule.venue} onChange={(e) => updateSchedule(schedule.id, { venue: e.target.value })} placeholder="Location" />
                  </div>
                  <div className="flex justify-end sm:justify-start">
                    <button onClick={() => removeSchedule(schedule.id)} className="p-2.5 rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Remove shoot schedule">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="label">Assign Team Members</label>
                  <button type="button" onClick={() => setOpenTeamSchedule(openTeamSchedule === schedule.id ? null : schedule.id)} className="input flex items-center justify-between text-left">
                    <span className={schedule.team.length ? 'text-gray-700' : 'text-gray-400'}>
                      {schedule.team.length ? `${schedule.team.length} member${schedule.team.length === 1 ? '' : 's'} assigned` : 'Select team members'}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                  {openTeamSchedule === schedule.id && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-pop p-2 max-h-48 overflow-y-auto">
                      {teamMembers.map((member) => {
                        const selected = schedule.team.includes(member.name)
                        return (
                          <label key={member.id} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-brand-50 cursor-pointer text-sm text-gray-700">
                            <input type="checkbox" checked={selected} onChange={() => toggleScheduleMember(schedule, member.name)} className="sr-only" />
                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300'}`}>
                              {selected && <Check size={12} />}
                            </span>
                            <span>{member.name} ({member.role || member.type})</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {schedule.team.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {schedule.team.map((memberName) => (
                        <span key={memberName} className="badge bg-brand-50 text-brand-700">
                          {memberName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {schedules.length === 0 && <p className="text-sm text-gray-400 py-2">No shoot schedules added yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Cost Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Package Cost *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm">₹</span>
                <input
                  type="number"
                  value={packageCost}
                  onChange={(e) => setPackageCost(e.target.value)}
                  placeholder="Enter total package cost"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            <div>
              <label className="label">Advance / Received Amount</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  max={packageCost || undefined}
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="Enter amount received"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onDone} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save size={15}/> {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}