'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Appointment, Lead } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import { Plus, Phone, Video, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'

const typeIcon = { phone_call: Phone, video_call: Video, in_person: MapPin }
const statusColor: Record<string, string> = {
  scheduled: 'text-blue-300 bg-blue-400/10',
  completed: 'text-green-300 bg-green-400/10',
  cancelled: 'text-red-300 bg-red-400/10',
  no_show: 'text-orange-300 bg-orange-400/10',
}

interface Props {
  appointments: (Appointment & { lead?: { first_name: string; last_name: string; company_name: string } | null })[]
  leads: Pick<Lead, 'id' | 'first_name' | 'last_name' | 'company_name'>[]
}

export default function AppointmentsClient({ appointments, leads }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    lead_id: '', title: '', type: 'video_call',
    start_time: '', end_time: '', meeting_link: '', notes: '', status: 'scheduled'
  })

  async function createAppointment(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setLoading(false)
    setShowForm(false)
    router.refresh()
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    router.refresh()
  }

  const upcoming = appointments.filter(a => a.status === 'scheduled' && new Date(a.start_time) >= new Date())
  const past = appointments.filter(a => a.status !== 'scheduled' || new Date(a.start_time) < new Date())

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">{upcoming.length} upcoming meetings</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={14} /> Book Meeting
        </button>
      </div>

      {/* New Appointment Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-medium mb-4">Book a Meeting</h2>
            <form onSubmit={createAppointment} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Lead *</label>
                <select value={form.lead_id} onChange={e => setForm(p => ({ ...p, lead_id: e.target.value }))} required
                  className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">Select lead...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name} — {l.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Intro call re: Manganese supply"
                  className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="video_call">Video Call</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Meeting Link</label>
                  <input type="url" value={form.meeting_link} onChange={e => setForm(p => ({ ...p, meeting_link: e.target.value }))} placeholder="Zoom/Meet URL"
                    className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start *</label>
                  <input type="datetime-local" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} required
                    className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End *</label>
                  <input type="datetime-local" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} required
                    className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Agenda, topics to discuss..."
                  className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {loading ? 'Booking...' : 'Book Meeting'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-[#0a0f1a] border border-[#1e293b] text-slate-400 hover:text-slate-200 rounded-lg px-4 py-2 text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map(apt => {
              const Icon = typeIcon[apt.type as keyof typeof typeIcon] || Clock
              return (
                <div key={apt.id} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{apt.title}</p>
                    <p className="text-slate-500 text-xs">{apt.lead ? `${apt.lead.first_name} ${apt.lead.last_name} · ${apt.lead.company_name}` : ''}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{formatDateTime(apt.start_time)}</p>
                  </div>
                  {apt.meeting_link && (
                    <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 rounded-lg px-3 py-1.5 text-xs transition-colors">
                      Join
                    </a>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => updateStatus(apt.id, 'completed')} title="Mark complete" className="text-green-400 hover:text-green-300 p-1.5 rounded-lg hover:bg-green-400/10 transition-colors">
                      <CheckCircle size={14} />
                    </button>
                    <button onClick={() => updateStatus(apt.id, 'cancelled')} title="Cancel" className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Past</h2>
          <div className="space-y-2">
            {past.slice(0, 10).map(apt => {
              const Icon = typeIcon[apt.type as keyof typeof typeIcon] || Clock
              return (
                <div key={apt.id} className="bg-[#111827] border border-[#1e293b] rounded-xl p-3 flex items-center gap-3 opacity-60">
                  <Icon size={14} className="text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm">{apt.title}</p>
                    <p className="text-slate-500 text-xs">{formatDateTime(apt.start_time)}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColor[apt.status])}>{apt.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <div className="text-center py-16">
          <Clock size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No appointments yet</p>
          <button onClick={() => setShowForm(true)} className="text-indigo-400 hover:text-indigo-300 text-sm mt-2">Book your first meeting</button>
        </div>
      )}
    </div>
  )
}
