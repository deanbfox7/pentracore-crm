'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lead, Activity } from '@/types'
import { cn, stageColor, scoreColor, formatDateTime, STAGES } from '@/lib/utils'
import { Edit2, Mail, Phone, Globe, Link2, MapPin, Building2, Star, Calendar, MessageSquare, ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { lead: Lead; activities: Activity[] }

const activityIcon: Record<string, string> = {
  email_sent: '📧', email_opened: '👁️', email_replied: '↩️', email_bounced: '⚠️',
  sms_sent: '💬', sms_replied: '↩️', call: '📞', note: '📝',
  stage_change: '🔄', meeting_booked: '📅', meeting_completed: '✅'
}

export default function LeadDetailClient({ lead, activities }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [scoring, setScoring] = useState(false)
  const [note, setNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [stage, setStage] = useState(lead.stage)
  const [score, setScore] = useState(lead.lead_score)
  const [reasoning, setReasoning] = useState(lead.score_reasoning || '')
  const [localActivities, setLocalActivities] = useState(activities)

  async function scoreWithAI() {
    setScoring(true)
    try {
      const res = await fetch('/api/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id })
      })
      const data = await res.json()
      if (data.score !== undefined) { setScore(data.score); setReasoning(data.reasoning) }
    } finally { setScoring(false) }
  }

  async function updateStage(newStage: string) {
    const old = stage
    setStage(newStage as Lead['stage'])
    await supabase.from('leads').update({ stage: newStage }).eq('id', lead.id)
    await supabase.from('activities').insert({
      lead_id: lead.id, type: 'stage_change',
      subject: `Stage changed`, body: `${old} → ${newStage}`
    })
    router.refresh()
  }

  async function addNote() {
    if (!note.trim()) return
    setAddingNote(true)
    const { data } = await supabase.from('activities').insert({
      lead_id: lead.id, type: 'note', body: note
    }).select().single()
    if (data) setLocalActivities(prev => [data, ...prev])
    setNote('')
    setAddingNote(false)
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-lg font-bold shrink-0">
            {lead.first_name[0]}{lead.last_name[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{lead.first_name} {lead.last_name}</h1>
            <p className="text-slate-400 text-sm">{lead.industry ? `${lead.industry} at ` : ''}{lead.company_name}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', stageColor(stage))}>
                {STAGES.find(s => s.id === stage)?.label}
              </span>
              {score > 0 && (
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', scoreColor(score))}>
                  Score: {score}/100
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={scoreWithAI} disabled={scoring}
            className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 rounded-lg px-3 py-2 text-sm transition-colors">
            {scoring ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            {scoring ? 'Scoring...' : 'AI Score'}
          </button>
          <Link href={`/leads/${lead.id}/edit`}
            className="flex items-center gap-1.5 bg-[#111827] border border-[#1e293b] text-slate-300 hover:bg-[#1e293b] rounded-lg px-3 py-2 text-sm transition-colors">
            <Edit2 size={14} /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Contact Info + Stage */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Contact</h2>
            <div className="space-y-2.5">
              {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <Mail size={14} className="text-slate-500" />{lead.email}
              </a>}
              {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <Phone size={14} className="text-slate-500" />{lead.phone}
              </a>}
              {lead.company_website && <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <Globe size={14} className="text-slate-500" />{lead.company_website.replace(/^https?:\/\//, '')}
              </a>}
              {lead.linkedin_url && <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                <Link2 size={14} />LinkedIn Profile
              </a>}
              {lead.country && <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin size={14} className="text-slate-500" />{lead.city ? `${lead.city}, ` : ''}{lead.country}
              </div>}
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Company</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300"><Building2 size={14} className="text-slate-500" />{lead.company_name}</div>
              {lead.industry && <div className="text-sm text-slate-400">{lead.industry}</div>}
              {lead.company_size && <div className="text-sm text-slate-400 capitalize">{lead.company_size} company</div>}
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Commodities</h2>
            <div className="flex flex-wrap gap-1.5">
              {(lead.commodities_of_interest || []).map(c => (
                <span key={c} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
            {lead.estimated_volume && <p className="text-slate-500 text-xs mt-2">Volume: {lead.estimated_volume}</p>}
            {lead.estimated_deal_value && <p className="text-slate-500 text-xs mt-1">Est. Value: ${lead.estimated_deal_value.toLocaleString()}</p>}
          </div>

          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Move Stage</h2>
            <div className="space-y-1">
              {STAGES.map(s => (
                <button key={s.id} onClick={() => updateStage(s.id)}
                  className={cn('w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors',
                    stage === s.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200')}>
                  {stage === s.id && '→ '}{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Score Reasoning */}
          {reasoning && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <h2 className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-2">AI Score Reasoning</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{reasoning}</p>
            </div>
          )}
        </div>

        {/* Right: Activity Timeline */}
        <div className="col-span-2">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <h2 className="text-sm font-medium text-white mb-4">Activity Timeline</h2>

            {/* Add Note */}
            <div className="flex gap-2 mb-5">
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="Add a note..."
                onKeyDown={e => e.key === 'Enter' && addNote()}
                className="flex-1 bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              <button onClick={addNote} disabled={addingNote || !note.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm transition-colors">
                {addingNote ? '...' : 'Add'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-5">
              {lead.email && (
                <Link href={`/campaigns?enroll=${lead.id}`}
                  className="flex items-center gap-1.5 text-xs bg-[#0a0f1a] border border-[#1e293b] text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] rounded-lg px-3 py-1.5 transition-colors">
                  <Mail size={12} /> Enroll in Campaign
                </Link>
              )}
              <Link href={`/appointments?lead=${lead.id}`}
                className="flex items-center gap-1.5 text-xs bg-[#0a0f1a] border border-[#1e293b] text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] rounded-lg px-3 py-1.5 transition-colors">
                <Calendar size={12} /> Book Meeting
              </Link>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {localActivities.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">No activity yet</p>
              ) : localActivities.map(activity => (
                <div key={activity.id} className="flex gap-3">
                  <div className="text-base w-6 shrink-0 mt-0.5">{activityIcon[activity.type] || '•'}</div>
                  <div className="min-w-0">
                    {activity.subject && <p className="text-white text-sm font-medium">{activity.subject}</p>}
                    {activity.body && <p className="text-slate-400 text-sm">{activity.body}</p>}
                    <p className="text-slate-600 text-xs mt-0.5">{formatDateTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
