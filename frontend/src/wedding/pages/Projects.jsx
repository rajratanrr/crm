import { motion } from 'framer-motion'
import { Plus, MapPin, Calendar as CalIcon, Package, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'

const statusStyle = {
  LEAD: 'bg-slate-100 text-slate-700',
  CONSULTATION: 'bg-blue-50 text-blue-700',
  PROPOSAL: 'bg-indigo-50 text-indigo-700',
  BOOKING: 'bg-purple-50 text-purple-700',
  PLANNING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  SHOOTING: 'bg-brand-100 text-brand-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  EDITING: 'bg-orange-50 text-orange-700',
  DELIVERY: 'bg-cyan-50 text-cyan-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
}

export default function Projects({ onCreate, onEdit }) {
  const { projects, clients, deleteProject } = useStore()

  const remove = (project) => {
    if (window.confirm(`Delete ${project.name}? This will remove the project and its schedules.`)) deleteProject(project.id)
  }

  const weddingProjects = projects.filter((p) => p.projectType === 'WEDDING' || (!p.projectType && !p.name?.toLowerCase().includes('shoot')));

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wedding Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage every wedding from consultation through delivery.</p>
        </div>
        <button onClick={onCreate} className="btn-primary"><Plus size={15}/> Create Project</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {weddingProjects.map((p) => {
          const client = clients.find((c) => c.id === p.clientId)
          const budget = Number(p.totalBudget) || 0
          const paid = Number(p.amountPaid) || 0
          const pct = budget > 0 ? Math.min(100, Math.round((paid / budget) * 100)) : 0
          const clientName = client?.brideName
            ? `${client.brideName}${client.groomName ? ` & ${client.groomName}` : ''}`
            : (p.rawProject?.customer?.fullName || 'Client')

          return (
            <motion.div key={p.id} layout whileHover={{ y: -3 }} className="card p-5 hover:shadow-card transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate" title={p.name}>{p.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{clientName}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`badge ${statusStyle[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                    <button onClick={() => onEdit(p)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit project" aria-label={`Edit ${p.name}`}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(p)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete project" aria-label={`Delete ${p.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                  {p.weddingDate && (
                    <div className="flex items-center gap-2 truncate">
                      <CalIcon size={13} className="text-gray-400 shrink-0"/> <span>{p.weddingDate}</span>
                    </div>
                  )}
                  {p.venue && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin size={13} className="text-gray-400 shrink-0"/> <span>{p.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <Package size={13} className="text-gray-400 shrink-0"/>
                    <span>{(p.deliverables || []).length} deliverables · {(p.events || []).length} events</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: .8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>₹{paid.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}</span>
                  <span className="font-semibold text-brand-600">{pct}%</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {weddingProjects.length === 0 && (
        <div className="card p-16 text-center">
          <div className="text-gray-400 mb-3">No wedding projects yet.</div>
          <button onClick={onCreate} className="btn-primary inline-flex"><Plus size={15}/> Create your first project</button>
        </div>
      )}
    </div>
  )
}