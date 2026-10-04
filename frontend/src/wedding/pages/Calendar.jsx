import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, X, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useStore } from '../store'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const eventColor = (n) => {
  const s = n.toLowerCase()
  if (s.includes('wedding')) return 'bg-brand-600 text-white'
  if (s.includes('reception') || s.includes('sangeet')) return 'bg-brand-500 text-white'
  if (s.includes('mehndi') || s.includes('haldi')) return 'bg-brand-100 text-brand-800'
  return 'bg-brand-50 text-brand-700'
}

export default function Calendar() {
  const { projects, team, attendance, setAttendance, assignTeamMember, removeTeamAssignment } = useStore()
  const [cursor, setCursor] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDate = {}
  projects.forEach((p) => {
    ;(p.events || []).forEach((e) => {
      if (e.date) {
        if (!eventsByDate[e.date]) eventsByDate[e.date] = []
        eventsByDate[e.date].push({ ...e, project: p.name })
      }
    })
  })

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const fmt = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const isToday = (d) => fmt(d) === new Date().toISOString().slice(0,10)
  const scheduledEvents = projects.flatMap((project) => (project.events || []).map((event) => ({ ...event, projectName: project.name, projectId: project.id })))
  const attendanceStatus = (eventId, memberId) => attendance.find((record) => record.eventId === eventId && record.memberId === memberId)?.status || 'UNMARKED'

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wedding Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">All events, shoots and delivery deadlines across projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="btn-outline p-2.5"><ChevronLeft size={15}/></button>
          <div className="px-4 py-2 rounded-lg bg-brand-50 text-brand-800 font-semibold text-sm">{MONTHS[month]} {year}</div>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="btn-outline p-2.5"><ChevronRight size={15}/></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {DOW.map((d) => (
            <div key={d} className="px-3 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const dateStr = d ? fmt(d) : null
            const evs = dateStr ? (eventsByDate[dateStr] || []) : []
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.004 }}
                className={`min-h-[110px] p-2 border-b border-r border-gray-100 ${d ? '' : 'bg-gray-50/40'} ${d && isToday(d) ? 'bg-brand-50/60' : ''}`}
              >
                {d && (
                  <>
                    <div className={`text-xs font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${isToday(d) ? 'bg-brand-600 text-white' : 'text-gray-700'}`}>
                      {d}
                    </div>
                    <div className="space-y-1">
                      {evs.slice(0, 2).map((e) => (
                        <button key={e.id} onClick={() => setSelectedEvent(e)} className={`block w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${eventColor(e.name)}`}>
                          {e.name}
                        </button>
                      ))}
                      {evs.length > 2 && <div className="text-[10px] text-gray-400">+{evs.length - 2} more</div>}
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {[['Wedding','bg-brand-600 text-white'],['Reception / Sangeet','bg-brand-500 text-white'],['Mehndi / Haldi','bg-brand-100 text-brand-800'],['Other','bg-brand-50 text-brand-700']].map(([label, cls]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${cls}`}></span><span className="text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-pop max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{selectedEvent.name}</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Close modal"><X size={18} /></button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Project:</strong> {selectedEvent.project}</p>
              <p><strong>Date:</strong> {selectedEvent.date}</p>
              <p><strong>Time:</strong> {selectedEvent.startTime || 'TBD'}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}</p>
              <p><strong>Venue:</strong> {selectedEvent.venue || 'TBD'}</p>
              <p><strong>Assigned Crew:</strong> {selectedEvent.team?.join(', ') || 'Not assigned yet'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Attendance & Crew Assignments</h3>
            <p className="text-xs text-gray-500 mt-1">Assign crew members to each scheduled shoot and track attendance.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{scheduledEvents.length} scheduled shoots</span>
            <Link
              to="/wedding/team-booking"
              className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg border border-brand-200 transition-colors"
            >
              Open Team Booking Schedule &rarr;
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {scheduledEvents.map((event) => {
            const assignedList = event.assignments || []
            const unassignedTeam = team.filter((m) => !event.team?.includes(m.name))

            return (
              <div key={event.id} className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                    <p className="text-xs text-gray-500">{event.projectName} · {event.date}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {event.startTime || 'Time TBD'}{event.venue ? ` · ${event.venue}` : ''}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {event.team?.length ? (
                    event.team.map((memberName) => {
                      const member = team.find((item) => item.name === memberName)
                      const assignment = assignedList.find((a) => a.employeeName === memberName || a.employeeId === member?.id)
                      const status = attendanceStatus(event.id, member?.id || memberName)

                      return (
                        <div
                          key={memberName}
                          className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg pl-2.5 pr-1 py-1 shadow-2xs"
                        >
                          <span className="text-xs font-medium text-gray-800">{memberName}</span>
                          {member?.role && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {member.role}
                            </span>
                          )}

                          <button
                            onClick={() =>
                              setAttendance({
                                eventId: event.id,
                                date: event.date,
                                memberId: member?.id || memberName,
                                memberName,
                                status: 'PRESENT',
                              })
                            }
                            className={`p-1 rounded transition-colors ${
                              status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-700 font-bold'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title="Mark present"
                            aria-label={`Mark ${memberName} present`}
                          >
                            <Check size={13} />
                          </button>

                          <button
                            onClick={() =>
                              setAttendance({
                                eventId: event.id,
                                date: event.date,
                                memberId: member?.id || memberName,
                                memberName,
                                status: 'ABSENT',
                              })
                            }
                            className={`p-1 rounded transition-colors ${
                              status === 'ABSENT'
                                ? 'bg-rose-100 text-rose-700 font-bold'
                                : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Mark absent"
                            aria-label={`Mark ${memberName} absent`}
                          >
                            <X size={13} />
                          </button>

                          {assignment?.id && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Unassign ${memberName} from this shoot?`)) {
                                  try {
                                    await removeTeamAssignment(event.id, assignment.id)
                                    toast.success(`${memberName} unassigned`)
                                  } catch {
                                    toast.error('Failed to unassign crew member')
                                  }
                                }
                              }}
                              className="p-1 rounded text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
                              title="Remove assignment"
                              aria-label={`Remove ${memberName}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <span className="text-xs text-gray-400 italic">No crew assigned to this shoot yet &mdash;</span>
                  )}

                  {/* Inline Quick Crew Assign Dropdown */}
                  {unassignedTeam.length > 0 && (
                    <select
                      value=""
                      onChange={async (e) => {
                        const empId = e.target.value
                        if (!empId) return
                        const emp = team.find((t) => t.id === empId)
                        try {
                          await assignTeamMember(event.id, empId, emp?.role || 'PHOTOGRAPHER')
                          toast.success(`${emp?.name || 'Crew member'} assigned to ${event.name}`)
                        } catch {
                          toast.error('Failed to assign crew member')
                        }
                      }}
                      className="text-xs border border-dashed border-gray-300 hover:border-brand-500 rounded-lg px-2 py-1 bg-white text-gray-600 hover:text-brand-700 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                    >
                      <option value="">+ Assign Crew</option>
                      {unassignedTeam.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role || 'Crew'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
          {scheduledEvents.length === 0 && (
            <p className="text-sm text-gray-400">Add a shoot schedule from a project to start tracking attendance.</p>
          )}
        </div>
      </div>
    </div>
  )
}