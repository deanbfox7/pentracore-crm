'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmailTemplate } from '@/types'
import { COMMODITIES } from '@/lib/utils'
import { Plus, Trash2, Edit2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TemplatesClient({ templates }: { templates: EmailTemplate[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: '', category: '', commodity_focus: [] as string[] })
  const [loading, setLoading] = useState(false)

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('email_templates').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('email_templates').insert({ ...form, owner_id: user!.id })
    }
    setLoading(false)
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', subject: '', body: '', category: '', commodity_focus: [] })
    router.refresh()
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return
    await supabase.from('email_templates').delete().eq('id', id)
    router.refresh()
  }

  function startEdit(t: EmailTemplate) {
    setEditing(t)
    setForm({ name: t.name, subject: t.subject, body: t.body, category: t.category || '', commodity_focus: t.commodity_focus || [] })
    setShowForm(true)
  }

  const categoryColor: Record<string, string> = {
    introduction: 'text-blue-300 bg-blue-400/10',
    follow_up: 'text-yellow-300 bg-yellow-400/10',
    proposal: 'text-purple-300 bg-purple-400/10',
    closing: 'text-green-300 bg-green-400/10',
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white">Email Templates</h1>
          <p className="text-slate-500 text-sm mt-0.5">Reusable templates for campaigns and one-off emails</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', subject: '', body: '', category: '', commodity_focus: [] }); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
          <Plus size={14} /> New Template
        </button>
      </div>

      {templates.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-[#111827] border border-[#1e293b] rounded-xl">
          <FileText size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No templates yet</p>
          <p className="text-slate-500 text-sm mb-4">Create reusable email templates for your outreach</p>
          <button onClick={() => setShowForm(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{t.subject}</p>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => startEdit(t)} className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => deleteTemplate(t.id)} className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="text-slate-600 text-xs line-clamp-3">{t.body}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.category && <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${categoryColor[t.category] || 'text-slate-400 bg-slate-400/10'}`}>{t.category.replace(/_/g, ' ')}</span>}
                {(t.commodity_focus || []).slice(0, 2).map(c => (
                  <span key={c} className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-medium mb-4">{editing ? 'Edit Template' : 'New Template'}</h2>
            <form onSubmit={saveTemplate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Template Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Introduction Email"
                    className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="">Select...</option>
                    <option value="introduction">Introduction</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="proposal">Proposal</option>
                    <option value="closing">Closing</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject Line *</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required placeholder="Subject (use {{first_name}}, {{company_name}}, etc.)"
                  className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Body *</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} required rows={10}
                  placeholder="Hi {{first_name}},&#10;&#10;Your email body here..."
                  className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono text-xs" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Commodity Focus</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMODITIES.map(c => (
                    <button key={c} type="button"
                      onClick={() => setForm(p => ({ ...p, commodity_focus: p.commodity_focus.includes(c) ? p.commodity_focus.filter(x => x !== c) : [...p.commodity_focus, c] }))}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${form.commodity_focus.includes(c) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-[#1e293b] text-slate-500 hover:border-slate-500'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-slate-600 text-xs">Available placeholders: {'{{first_name}} {{last_name}} {{company_name}} {{country}} {{commodity}} {{industry}}'}</p>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  {loading ? 'Saving...' : (editing ? 'Update Template' : 'Create Template')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
                  className="bg-[#0a0f1a] border border-[#1e293b] text-slate-400 rounded-lg px-4 py-2 text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
