'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Mail, MessageSquare } from 'lucide-react'

interface Step {
  step_order: number
  channel: 'email' | 'sms'
  subject_template: string
  body_template: string
  delay_days: number
  delay_hours: number
  use_ai_personalization: boolean
}

const defaultTemplates = {
  email: {
    subject: 'Mineral Supply Opportunity — {{company_name}}',
    body: `Hi {{first_name}},

I hope this message finds you well. My name is Dean, and I represent Pentracore International — a specialist in African mineral commodities including manganese, chrome, iron ore, and copper.

Given {{company_name}}'s work in {{industry}}, I believe we may have supply that matches your requirements. We offer competitive pricing, verified SGS quality reports, and flexible delivery terms (FOB/CIF).

Would you be open to a 15-minute call this week to discuss your current sourcing needs?

Best regards,
Dean Fox
Pentracore International`
  },
  sms: {
    subject: '',
    body: 'Hi {{first_name}}, this is Dean from Pentracore International. We supply African minerals (manganese, chrome, iron ore) to manufacturers globally. Interested in pricing for {{commodity}}? Reply YES for details.'
  }
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<Step[]>([{
    step_order: 1, channel: 'email',
    subject_template: defaultTemplates.email.subject,
    body_template: defaultTemplates.email.body,
    delay_days: 0, delay_hours: 0, use_ai_personalization: true
  }])

  function addStep() {
    const last = steps[steps.length - 1]
    setSteps(prev => [...prev, {
      step_order: prev.length + 1, channel: 'email',
      subject_template: 'Following up — {{company_name}}',
      body_template: `Hi {{first_name}},\n\nJust following up on my previous message about mineral supply from Pentracore International.\n\nHave you had a chance to consider our offer?\n\nBest,\nDean`,
      delay_days: 3, delay_hours: 0, use_ai_personalization: false
    }])
  }

  function updateStep(index: number, updates: Partial<Step>) {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s))
  }

  function removeStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, steps })
    })
    const data = await res.json()
    router.push(`/campaigns/${data.id}`)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-1">New Campaign</h1>
      <p className="text-slate-500 text-sm mb-6">Build a multi-step automated outreach sequence</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Campaign Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Chrome Buyers Outreach — Asia Q2"
              className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Target audience or goal"
              className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-white">Sequence Steps</h2>
          <p className="text-slate-500 text-xs">Use placeholders: {'{{first_name}} {{last_name}} {{company_name}} {{country}} {{commodity}} {{industry}}'}</p>

          {steps.map((step, index) => (
            <div key={index} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold">{step.step_order}</div>
                  <div className="flex gap-1">
                    {(['email', 'sms'] as const).map(ch => (
                      <button key={ch} type="button"
                        onClick={() => updateStep(index, {
                          channel: ch,
                          subject_template: ch === 'email' ? defaultTemplates.email.subject : '',
                          body_template: ch === 'email' ? defaultTemplates.email.body : defaultTemplates.sms.body
                        })}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                          step.channel === ch ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
                        }`}>
                        {ch === 'email' ? <Mail size={10} /> : <MessageSquare size={10} />}
                        {ch.charAt(0).toUpperCase() + ch.slice(1)}
                      </button>
                    ))}
                  </div>
                  {index > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      Wait
                      <input type="number" value={step.delay_days} min="0" onChange={e => updateStep(index, { delay_days: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-[#0a0f1a] border border-[#1e293b] rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-indigo-500" />
                      days
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={step.use_ai_personalization} onChange={e => updateStep(index, { use_ai_personalization: e.target.checked })}
                      className="rounded border-slate-600" />
                    AI Personalize
                  </label>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(index)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {step.channel === 'email' && (
                <input value={step.subject_template} onChange={e => updateStep(index, { subject_template: e.target.value })}
                  placeholder="Email subject..."
                  className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 mb-2" />
              )}
              <textarea value={step.body_template} onChange={e => updateStep(index, { body_template: e.target.value })}
                rows={step.channel === 'email' ? 6 : 3} placeholder="Message body..."
                className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono text-xs" />
            </div>
          ))}

          <button type="button" onClick={addStep}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-500 rounded-xl py-3 text-sm transition-colors">
            <Plus size={14} /> Add Step
          </button>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || !name.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="bg-[#111827] border border-[#1e293b] text-slate-300 hover:bg-[#1e293b] rounded-lg px-5 py-2.5 text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
