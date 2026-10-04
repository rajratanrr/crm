import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  const { projects } = useStore()
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
    </div>
  )
}