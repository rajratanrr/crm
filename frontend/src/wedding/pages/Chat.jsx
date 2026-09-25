import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Search, Paperclip } from 'lucide-react'

const threads = [
  { id: 1, name: 'Ananya & Rohan', last: 'Can we schedule the pre-wedding shoot?', time: '2m', unread: 2 },
  { id: 2, name: 'Priya & Arjun',  last: "Received the teaser! It's stunning 😍", time: '1h', unread: 0 },
  { id: 3, name: 'Sneha & Vikram', last: 'Please share the album drafts.', time: '3h', unread: 1 },
  { id: 4, name: 'Team · Photographers', last: "Rahul: I'll bring the 85mm", time: '5h', unread: 0 },
]

const seedMessages = {
  1: [
    { id: 1, from: 'them', text: 'Hi! Quick question about the pre-wedding shoot dates.', time: '10:12' },
    { id: 2, from: 'me',   text: 'Hi Ananya! Sure, we have openings on Feb 5 and Feb 8.', time: '10:15' },
    { id: 3, from: 'them', text: 'Can we schedule the pre-wedding shoot?', time: '10:20' },
  ],
}

export default function Chat() {
  const [active, setActive] = useState(1)
  const [messages, setMessages] = useState(seedMessages)
  const [draft, setDraft] = useState('')

  const send = () => {
    if (!draft.trim()) return
    setMessages((m) => ({
      ...m,
      [active]: [...(m[active] || []), { id: Date.now(), from: 'me', text: draft, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
    }))
    setDraft('')
  }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search conversations…" className="input pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <motion.div
              key={t.id}
              onClick={() => setActive(t.id)}
              whileHover={{ x: 2 }}
              className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${active === t.id ? 'bg-brand-50/60 border-l-2 border-l-brand-600' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm text-gray-900 truncate">{t.name}</div>
                <div className="text-[10px] text-gray-400">{t.time}</div>
              </div>
              <div className="text-xs text-gray-500 truncate">{t.last}</div>
              {t.unread > 0 && (
                <span className="inline-block mt-1.5 text-[10px] font-semibold bg-brand-600 text-white px-1.5 py-0.5 rounded-full">{t.unread} new</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="h-16 px-6 bg-white border-b border-gray-100 flex items-center">
          <div className="font-semibold text-gray-900">{threads.find((t) => t.id === active)?.name}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {(messages[active] || []).map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-soft ${
                m.from === 'me' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'
              }`}>
                {m.text}
                <div className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-white/70' : 'text-gray-400'}`}>{m.time}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
          <button className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-500"><Paperclip size={18}/></button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            className="flex-1 input"
          />
          <button onClick={send} className="btn-primary"><Send size={15}/></button>
        </div>
      </div>
    </div>
  )
}