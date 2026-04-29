import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { ShieldCheck, AlertTriangle, Sparkles, Target, Clock } from 'lucide-react'

export default async function AiInsightsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) redirect('/login')

  const [{ data: deals }, { data: tasks }] = await Promise.all([
    supabase
      .from('deals')
      .select('id, deal_code, stage_index, stage, commodity, probability, blocker, next_action, estimated_gmv, estimated_commission')
      .eq('owner_id', user.id),
    supabase
      .from('deal_tasks')
      .select('id, title, due_at, priority, status, deal:deals(deal_code)')
      .eq('owner_id', user.id)
      .eq('status', 'open'),
  ])

  type DealRow = {
    deal_code: string
    stage_index: number
    stage: string
    commodity: string
    probability: number | null
    blocker: string | null
    next_action: string | null
    estimated_gmv: number | null
    estimated_commission: number | null
  }

  type TaskRow = {
    id: string
    title: string
    due_at: string | null
    priority: string
    status: string
    deal?: { deal_code?: string } | null
  }

  const dealRows = (deals || []) as unknown as DealRow[]
  const taskRows = (tasks || []) as unknown as TaskRow[]

  // Heuristic "AI" insights (works even without an LLM key).
  const bestDeals = [...dealRows].sort((a, b) => (b.probability || 0) - (a.probability || 0)).slice(0, 5)
  const likelyToClose = [...dealRows]
    .filter(d => (d.probability || 0) >= 60 || Number(d.stage_index || 0) >= 6)
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, 6)

  const highRiskDeals = [...dealRows]
    .filter(d => (d.probability || 0) < 40 || Boolean(d.blocker))
    .sort((a, b) => (a.probability || 0) - (b.probability || 0))
    .slice(0, 6)

  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const urgentTasks = taskRows
    .filter(t => t.due_at ? new Date(t.due_at).getTime() <= now + weekMs : true)
    .slice(0, 6)

  const urgentIssues = [
    ...urgentTasks.map(t => ({
      type: 'Task',
      title: t.title,
      deal: t.deal?.deal_code || null,
      due_at: t.due_at || null,
      priority: t.priority,
    })),
    ...dealRows
      .filter(d => Boolean(d.blocker))
      .slice(0, 4)
      .map(d => ({
        type: 'Blocker',
        title: d.blocker,
        deal: d.deal_code,
        due_at: null,
        priority: 'high',
      })),
  ].slice(0, 8)

  const nextBestAction = (() => {
    if (urgentTasks.length > 0) {
      const t = urgentTasks[0]
      return `Complete next urgent task: “${t.title}”${t.deal?.deal_code ? ` (Deal ${t.deal.deal_code})` : ''}.`
    }

    const stageUrgent = [...dealRows].sort((a, b) => (a.stage_index || 1) - (b.stage_index || 1))[0]
    if (stageUrgent) {
      return `Advance the earliest stage deal to the next hard gate: “${stageUrgent.deal_code}” (Stage ${stageUrgent.stage_index}).`
    }
    return 'No actions required right now based on current data.'
  })()

  // Optional LLM formatting pass (only if key exists).
  let aiSummary: {
    bestDeals: string[]
    likelyToCloseDeals: string[]
    highRiskDeals: string[]
    urgentIssues: string[]
    nextBestAction: string
  } = {
    bestDeals: bestDeals.map(d => `${d.deal_code} (${d.commodity}) — ${d.probability != null ? Math.round(d.probability) : 0}%`),
    likelyToCloseDeals: likelyToClose.map(d => `${d.deal_code} — Stage ${d.stage_index}`),
    highRiskDeals: highRiskDeals.map(d => `${d.deal_code} — Stage ${d.stage_index}${d.blocker ? ` | Blocker: ${d.blocker}` : ''}`),
    urgentIssues: urgentIssues.map(u => `${u.type}: ${u.title}${u.deal ? ` (Deal ${u.deal})` : ''}`),
    nextBestAction,
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const prompt = `
You are an executive assistant for PentraCore Deal Intelligence Platform.
Create a premium, concise JSON summary for a deal dashboard.

Return ONLY valid JSON with this schema:
{
 "bestDeals": string[],
 "likelyToCloseDeals": string[],
 "highRiskDeals": string[],
 "urgentIssues": string[],
 "nextBestAction": string
}

Use the following raw data:
Deals (top fields):
${JSON.stringify(dealRows.map(d => ({
  deal_code: d.deal_code,
  commodity: d.commodity,
  stage_index: d.stage_index,
  stage: d.stage,
  probability: d.probability,
  blocker: d.blocker,
  next_action: d.next_action,
  estimated_commission: d.estimated_commission,
}), null, 0)).slice(0, 6000)}

Open tasks:
${JSON.stringify(taskRows.map(t => ({
  title: t.title,
  deal: t.deal?.deal_code || null,
  due_at: t.due_at,
  priority: t.priority
})), null, 0).slice(0, 4000)}
`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 550,
      })

      const content = response.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(content)
      aiSummary = {
        bestDeals: Array.isArray(parsed.bestDeals) ? parsed.bestDeals : aiSummary.bestDeals,
        likelyToCloseDeals: Array.isArray(parsed.likelyToCloseDeals) ? parsed.likelyToCloseDeals : aiSummary.likelyToCloseDeals,
        highRiskDeals: Array.isArray(parsed.highRiskDeals) ? parsed.highRiskDeals : aiSummary.highRiskDeals,
        urgentIssues: Array.isArray(parsed.urgentIssues) ? parsed.urgentIssues : aiSummary.urgentIssues,
        nextBestAction: typeof parsed.nextBestAction === 'string' ? parsed.nextBestAction : aiSummary.nextBestAction,
      }
    }
  } catch {
    // If LLM fails, keep heuristic output.
  }

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/5 text-yellow-300 text-xs">
            <Sparkles size={14} /> AI Insights
          </div>
          <h1 className="text-2xl font-semibold text-white mt-3">Next Best Action Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Best deals, high-risk deals, urgent issues, and the single most valuable next move.</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-[#1e293b]">
            <ShieldCheck size={14} /> Confidential-by-design
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">Best Deals</div>
            <Target size={16} className="text-indigo-300" />
          </div>
          {aiSummary.bestDeals.length === 0 ? (
            <div className="text-slate-500 text-sm">No deal data available.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {aiSummary.bestDeals.map((s, i) => (
                <li key={i} className="text-slate-300 bg-[#0b1220] border border-[#1e293b] rounded-lg px-3 py-2">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">Likely to Close</div>
            <Target size={16} className="text-emerald-300" />
          </div>
          {aiSummary.likelyToCloseDeals.length === 0 ? (
            <div className="text-slate-500 text-sm">No likely-to-close deals found.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {aiSummary.likelyToCloseDeals.map((s, i) => (
                <li key={i} className="text-slate-300 bg-[#0b1220] border border-[#1e293b] rounded-lg px-3 py-2">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">High Risk / Blocked</div>
            <AlertTriangle size={16} className="text-red-300" />
          </div>
          {aiSummary.highRiskDeals.length === 0 ? (
            <div className="text-slate-500 text-sm">No high-risk deals detected.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {aiSummary.highRiskDeals.map((s, i) => (
                <li key={i} className="text-red-100 bg-[#0b1220] border border-[#1e293b] rounded-lg px-3 py-2">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white font-medium flex items-center gap-2">
              <Clock size={16} className="text-yellow-300" /> Urgent Issues
            </div>
            <div className="text-slate-500 text-sm mt-1">Tasks due soon and deal blockers requiring immediate attention.</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            {aiSummary.urgentIssues.length} items
          </div>
        </div>

        {aiSummary.urgentIssues.length === 0 ? (
          <div className="text-slate-500 text-sm">No urgent issues right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSummary.urgentIssues.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#1e293b] bg-[#0b1220] px-3 py-2 text-sm text-slate-300">
                {s}
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-[#1e293b]">
          <div className="text-white font-medium mb-2">Next Best Action</div>
          <div className="text-slate-200 bg-[#0b1220] border border-[#1e293b] rounded-xl p-4 text-sm leading-relaxed">
            {aiSummary.nextBestAction}
          </div>
        </div>
      </section>
    </div>
  )
}

