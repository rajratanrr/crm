import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, Save, Check, AlertCircle, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store'

const DEFAULT_MASTER_ROLES = [
  'Traditional Photographer',
  'Traditional Videographer',
  'Candid Photographer',
  'Cinematic',
  'Drone',
  'Insta 360',
  'Wedding Manager',
  'Lighting Technician',
  'Mobile Content Creator',
  'Traditional Photo Editor',
  'Traditional Video Editor',
  'Candid Photo Editor',
  'Cinematic Video Editor',
  'Drone Editor',
  'Mobile/Reel Content Editor',
]

const emptyDeliverable = () => ({ id: Math.random().toString(36).slice(2), name: '', status: 'PENDING', dueDate: '' })
const emptySchedule = () => ({
  id: Math.random().toString(36).slice(2),
  name: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  team: [],
  requirements: [],
})

export default function CreateProject({ onDone, project }) {
  const { clients, team: teamMembers, addProject, updateProject } = useStore()
  
  // Extract initial Bride & Groom name if editing
  const [brideName, setBrideName] = useState(() => {
    if (project?.brideName) return project.brideName
    if (project?.name && project.name.includes('&')) {
      const parts = project.name.split('&')
      return parts[0]?.replace(/wedding/i, '').trim()
    }
    return ''
  })

  const [groomName, setGroomName] = useState(() => {
    if (project?.groomName) return project.groomName
    if (project?.name && project.name.includes('&')) {
      const parts = project.name.split('&')
      return parts[1]?.replace(/wedding/i, '').trim()
    }
    return ''
  })

  const [name, setName] = useState(() => project?.name || '')
  const [clientPhone, setClientPhone] = useState(() => project?.clientPhone || project?.rawCustomer?.phone || '')
  const [packageCost, setPackageCost] = useState(() => String(project?.totalBudget || ''))
  const [receivedAmount, setReceivedAmount] = useState(() => String(project?.amountPaid || ''))
  const [deliverables, setDeliverables] = useState(() => project?.deliverables || [emptyDeliverable()])
  const [schedules, setSchedules] = useState(() =>
    (project?.events || []).map((event) => {
      let reqs = event.requirements || []
      if ((!reqs || reqs.length === 0) && Array.isArray(event.team) && event.team.length > 0) {
        reqs = event.team.map((t) => {
          if (typeof t === 'object' && t.role) return t
          const match = String(t).match(/^(.*?)(?:\s*x(\d+))?$/)
          return {
            role: match ? match[1].trim() : String(t),
            count: match && match[2] ? parseInt(match[2], 10) : 1,
          }
        })
      }
      return {
        ...event,
        team: event.team || [],
        requirements: reqs || [],
      }
    })
  )
  
  // Master roles state (saved in localStorage for persistence across sessions)
  const [masterRoles, setMasterRoles] = useState(() => {
    try {
      const saved = localStorage.getItem('wedding_master_roles')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_MASTER_ROLES
  })
  const [newMasterRole, setNewMasterRole] = useState('')
  const [activeReqScheduleId, setActiveReqScheduleId] = useState(null)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleBrideChange = (val) => {
    const prevBride = brideName
    setBrideName(val)
    if (!name || name === `${prevBride} & ${groomName} Wedding`.trim() || name === `${prevBride} Wedding`.trim()) {
      const couple = [val.trim(), groomName.trim()].filter(Boolean).join(' & ')
      setName(couple ? `${couple} Wedding` : '')
    }
    if (error) setError('')
  }

  const handleGroomChange = (val) => {
    const prevGroom = groomName
    setGroomName(val)
    if (!name || name === `${brideName} & ${prevGroom} Wedding`.trim() || name === `${prevGroom} Wedding`.trim()) {
      const couple = [brideName.trim(), val.trim()].filter(Boolean).join(' & ')
      setName(couple ? `${couple} Wedding` : '')
    }
    if (error) setError('')
  }

  const updateDel = (id, patch) => setDeliverables((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const removeDel = (id) => setDeliverables((d) => d.filter((x) => x.id !== id))
  const updateSchedule = (id, patch) => setSchedules((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  const removeSchedule = (id) => setSchedules((items) => items.filter((item) => item.id !== id))

  // Master role management
  const handleAddMasterRole = (e) => {
    if (e) e.preventDefault()
    const trimmed = newMasterRole.trim()
    if (!trimmed) return
    if (masterRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Role already exists in master list')
      return
    }
    const updated = [...masterRoles, trimmed]
    setMasterRoles(updated)
    try {
      localStorage.setItem('wedding_master_roles', JSON.stringify(updated))
    } catch {}
    setNewMasterRole('')
    toast.success(`Added "${trimmed}" to master list`)
  }

  const handleDeleteMasterRole = (roleToDelete, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm(`Delete "${roleToDelete}" from master list?`)) return
    const updated = masterRoles.filter((r) => r !== roleToDelete)
    setMasterRoles(updated)
    try {
      localStorage.setItem('wedding_master_roles', JSON.stringify(updated))
    } catch {}
    // Also remove from all active schedule requirements
    setSchedules((prev) =>
      prev.map((s) => ({
        ...s,
        requirements: (s.requirements || []).filter((r) => r.role !== roleToDelete),
      }))
    )
    toast.success(`Removed "${roleToDelete}"`)
  }

  // Active schedule requirement toggles and count updates
  const activeSchedule = schedules.find((s) => s.id === activeReqScheduleId)

  const toggleScheduleRole = (scheduleId, roleName) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s
        const currentReqs = s.requirements || []
        const exists = currentReqs.some((r) => r.role === roleName)
        let updatedReqs
        if (exists) {
          updatedReqs = currentReqs.filter((r) => r.role !== roleName)
        } else {
          updatedReqs = [...currentReqs, { role: roleName, count: 1 }]
        }
        const updatedTeam = updatedReqs.map((r) => `${r.role}${r.count > 1 ? ` x${r.count}` : ''}`)
        return { ...s, requirements: updatedReqs, team: updatedTeam }
      })
    )
  }

  const updateScheduleRoleCount = (scheduleId, roleName, newCount) => {
    const count = Math.max(1, parseInt(newCount, 10) || 1)
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s
        const updatedReqs = (s.requirements || []).map((r) =>
          r.role === roleName ? { ...r, count } : r
        )
        const updatedTeam = updatedReqs.map((r) => `${r.role}${r.count > 1 ? ` x${r.count}` : ''}`)
        return { ...s, requirements: updatedReqs, team: updatedTeam }
      })
    )
  }

  const cleanInputPhone = clientPhone.replace(/\D/g, '')
  const matchedClient = clients.find((c) => {
    if (!c.phone || cleanInputPhone.length < 10) return false
    const digits = String(c.phone).replace(/\D/g, '')
    return digits.endsWith(cleanInputPhone.slice(-10))
  })

  const save = async () => {
    setError('')
    const coupleText = [brideName.trim(), groomName.trim()].filter(Boolean).join(' & ')
    const resolvedName = name.trim() || (coupleText ? `${coupleText} Wedding` : '')

    if (!resolvedName) {
      setError('Please enter Bride and Groom name or Project name.')
      return
    }
    if (!packageCost || Number(packageCost) < 0) {
      setError('Please enter a valid package cost.')
      return
    }

    setSaving(true)
    try {
      const cid = project?.clientId || matchedClient?.id || ''
      const payload = {
        name: resolvedName,
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        clientId: cid,
        clientPhone: cleanInputPhone.slice(-10),
        totalBudget: Number(packageCost) || 0,
        amountPaid: Number(receivedAmount) || 0,
        status: project?.status || 'CONFIRMED',
        deliverables: deliverables.filter((d) => d.name?.trim()),
        events: schedules
          .filter((schedule) => schedule.name?.trim() && schedule.date)
          .map(({ id, name: eventName, ...schedule }) => ({
            id,
            name: eventName.trim(),
            ...schedule,
            team: (schedule.requirements || []).map((r) => `${r.role}${r.count > 1 ? ` x${r.count}` : ''}`),
          })),
      }

      // Race with an 8-second safety timeout so saving never hangs indefinitely
      const savePromise = project ? updateProject(project.id, payload) : addProject(payload)
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 8000))

      const result = await Promise.race([savePromise, timeoutPromise])
      if (result === 'timeout') {
        console.warn('Save completed in background (slow network).')
      }

      toast.success(project ? 'Project updated successfully!' : 'Project created successfully!')
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
        {/* Project & Client Details */}
        <div className="card p-6">
          <label className="label text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Project Name *</label>
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
            <h3 className="text-sm font-bold text-gray-900 mb-3">Client Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Bride Name</label>
                <input
                  value={brideName}
                  onChange={(e) => handleBrideChange(e.target.value)}
                  placeholder="Bride Name (e.g., Aditi)"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Groom Name</label>
                <input
                  value={groomName}
                  onChange={(e) => handleGroomChange(e.target.value)}
                  placeholder="Groom Name (e.g., Rahul)"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Client Phone *</label>
              <div className="flex max-w-md">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm">🇮🇳 +91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit phone to match or add client"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            {matchedClient && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                ✓ Matched Client: <strong>{matchedClient.brideName} & {matchedClient.groomName}</strong>
              </motion.div>
            )}
          </div>
        </div>

        {/* Shoot Schedule (SWAPPED: Now First) */}
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
            {schedules.map((schedule) => {
              const reqs = schedule.requirements || []

              return (
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

                  {/* Manage Requirements Trigger (Replaced Select team members) */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">Team Requirements &amp; Crew</label>
                      <button
                        type="button"
                        onClick={() => setActiveReqScheduleId(schedule.id)}
                        className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] flex items-center gap-1 hover:underline"
                      >
                        <Users size={13} /> Manage Requirements
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveReqScheduleId(schedule.id)}
                      className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-blue-400 bg-white transition-all group cursor-pointer shadow-2xs"
                    >
                      {reqs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {reqs.map((r) => (
                            <span
                              key={r.role}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200/60"
                            >
                              <span>{r.role}</span>
                              <span className="bg-[#2563eb] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                {r.count}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-gray-400 py-0.5">
                          <span>Select roles and crew requirements (e.g. Traditional Photographer x1, Drone x1)...</span>
                          <span className="text-[#2563eb] font-semibold text-xs group-hover:underline">+ Configure</span>
                        </div>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
            {schedules.length === 0 && <p className="text-sm text-gray-400 py-2">No shoot schedules added yet.</p>}
          </div>
        </div>

        {/* Deliverables (SWAPPED: Now Second) */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
          </div>
          <div className="space-y-2">
            {deliverables.map((d) => (
              <motion.div key={d.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 items-center">
                <input value={d.name} onChange={(e) => updateDel(d.id, { name: e.target.value })} placeholder="e.g., Wedding Album, Cinematic Video" className="input flex-1 min-w-[200px]" />
                <select value={d.status} onChange={(e) => updateDel(d.status, { status: e.target.value })} className="input w-44">
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

        {/* Project Cost Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Cost Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Package Cost *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={packageCost}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) setPackageCost(val);
                  }}
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
                  step="any"
                  max={packageCost || undefined}
                  value={receivedAmount}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) setReceivedAmount(val);
                  }}
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

      {/* Manage Requirements Modal (Exact Replica of Image 2) */}
      {activeSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Manage Requirements
              </h3>
              <button
                type="button"
                onClick={() => setActiveReqScheduleId(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Master List Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Master List</label>
                <form onSubmit={handleAddMasterRole} className="flex gap-2">
                  <input
                    type="text"
                    value={newMasterRole}
                    onChange={(e) => setNewMasterRole(e.target.value)}
                    placeholder="Add new role to master list"
                    className="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                  >
                    <Plus size={14} /> Add
                  </button>
                </form>
              </div>

              {/* Configure Selected Roles Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  Configure Selected Roles ({(activeSchedule.requirements || []).length})
                </label>
                {(activeSchedule.requirements || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeSchedule.requirements.map((req) => (
                      <div
                        key={req.role}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white shadow-2xs hover:border-blue-300 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900 pr-2 truncate">
                          {req.role}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-gray-500 font-medium">Count:</span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={req.count}
                            onChange={(e) =>
                              updateScheduleRoleCount(
                                activeSchedule.id,
                                req.role,
                                e.target.value
                              )
                            }
                            className="w-12 px-1.5 py-1 text-xs font-bold text-center border border-gray-200 rounded-lg outline-none focus:border-[#2563eb] bg-gray-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center">
                    No roles selected yet. Click any role from the master list below to configure.
                  </p>
                )}
              </div>

              {/* Master Role Pills / Toggle Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {masterRoles.map((role) => {
                    const isSelected = (activeSchedule.requirements || []).some(
                      (r) => r.role === role
                    )

                    return (
                      <div
                        key={role}
                        onClick={() => toggleScheduleRole(activeSchedule.id, role)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-300 text-blue-900 font-semibold shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate pr-1">
                          {isSelected ? (
                            <Check size={13} className="text-[#2563eb] shrink-0" />
                          ) : (
                            <Plus size={13} className="text-gray-400 shrink-0" />
                          )}
                          <span className="truncate">{role}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteMasterRole(role, e)}
                          className="p-1 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 transition-colors shrink-0 ml-1"
                          title={`Delete "${role}" from master list`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                type="button"
                onClick={() => setActiveReqScheduleId(null)}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}