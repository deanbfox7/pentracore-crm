/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LogisticsConstraintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: constraints },
    { data: routes },
    { data: deals },
  ] = await Promise.all([
    supabase
      .from('constraints')
      .select('id, country, constraint_type, details, permits_required, permit_names, severity, deal:deals(deal_code, commodity, stage_index)')
      .eq('owner_id', user.id)
      .order('severity', { ascending: true }),

    supabase
      .from('logistics_routes')
      .select('id, origin_country, origin_port, destination_country, destination_port, transport_method, route_notes, bottleneck_notes, deal:deals(deal_code, commodity)')
      .eq('owner_id', user.id),

    supabase
      .from('deals')
      .select('id, deal_code, commodity, stage_index, next_action, blocker')
      .eq('owner_id', user.id)
      .order('stage_index', { ascending: true })
      .limit(50),
  ])

  const hasData = (constraints || []).length > 0 || (routes || []).length > 0

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Logistics & Constraints Engine</h1>
        <p className="text-slate-500 text-sm mt-1">
          Country restrictions, permits, export/import posture, transport routes, bottlenecks, and execution blockers.
        </p>
      </div>

      {!hasData && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 text-slate-500 text-sm">
          No logistics/constraints records yet. Start by importing deals and then uploading/linking documents and recording constraints.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="text-white font-medium">Constraints</div>
          {(constraints || []).length === 0 ? (
            <div className="text-slate-500 text-sm">No constraints logged.</div>
          ) : (
            <div className="space-y-2">
              {(constraints || []).map((c: any) => (
                <div key={c.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{c.constraint_type}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {c.deal?.deal_code ? `Deal ${c.deal.deal_code} • ` : ''}{c.country || 'Unknown country'}
                      </div>
                    </div>
                    <div className="text-yellow-200 text-xs font-semibold whitespace-nowrap">
                      Severity: {c.severity || 'medium'}
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs mt-2 line-clamp-3">{c.details || '—'}</div>
                  <div className="text-slate-500 text-[11px] mt-2">
                    Permits required: {c.permits_required ? 'yes' : 'no'}
                    {Array.isArray(c.permit_names) && c.permit_names.length > 0
                      ? ` • ${c.permit_names.slice(0, 5).join(', ')}${c.permit_names.length > 5 ? '…' : ''}`
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="text-white font-medium">Logistics Routes</div>
          {(routes || []).length === 0 ? (
            <div className="text-slate-500 text-sm">No logistics routes logged.</div>
          ) : (
            <div className="space-y-2">
              {(routes || []).map((r: any) => (
                <div key={r.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {r.deal?.deal_code ? `Deal ${r.deal.deal_code}` : 'Route'}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {r.origin_country || '—'} {r.origin_port ? `(${r.origin_port})` : ''} →
                        {' '}
                        {r.destination_country || '—'} {r.destination_port ? `(${r.destination_port})` : ''}
                      </div>
                    </div>
                    <div className="text-indigo-200 text-xs font-semibold whitespace-nowrap">
                      {r.transport_method || '—'}
                    </div>
                  </div>
                  {r.route_notes && <div className="text-slate-400 text-xs mt-2 line-clamp-3">{r.route_notes}</div>}
                  {r.bottleneck_notes && (
                    <div className="text-red-200 text-xs mt-2 line-clamp-3">
                      Bottleneck: {r.bottleneck_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
        <div className="text-white font-medium mb-3">Deals with Blockers</div>
        <div className="space-y-2">
          {(deals || []).filter((d: any) => Boolean(d.blocker)).length === 0 ? (
            <div className="text-slate-500 text-sm">No deal-level blockers found.</div>
          ) : (
            (deals || []).filter((d: any) => Boolean(d.blocker)).slice(0, 10).map((d: any) => (
              <div key={d.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium">{d.deal_code}</div>
                    <div className="text-slate-500 text-xs mt-1">Stage {d.stage_index} • {d.commodity}</div>
                    <div className="text-red-200 text-xs mt-2 line-clamp-2">{d.blocker}</div>
                  </div>
                  <div className="text-right text-slate-400 text-xs">{d.next_action || ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

