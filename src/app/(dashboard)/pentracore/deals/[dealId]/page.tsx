import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatMaybeNumber(n: number | null | undefined) {
  if (n == null) return '—'
  return Number.isFinite(n) ? String(n) : '—'
}

export default async function DealDetailPage({ params }: { params: { dealId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deal } = await supabase
    .from('deals')
    .select('id, deal_code, stage, stage_index, side, commodity, grade_spec, volume, basis, price_zar_per_mt, incoterm, payment_instrument, term, estimated_gmv, estimated_commission, probability, next_action, blocker, origin_region, origin_country, destination_country, destination_port')
    .eq('owner_id', user.id)
    .eq('id', params.dealId)
    .maybeSingle()

  if (!deal) {
    return (
      <div className="p-6 max-w-5xl text-slate-400">
        Deal not found.
        <div className="mt-3">
          <Link href="/pentracore/deals" className="text-indigo-300 hover:text-indigo-200">Back to deals</Link>
        </div>
      </div>
    )
  }

  const [
    { data: participants },
    { data: documents },
    { data: tasks },
    { data: logistics },
    { data: constraints },
  ] = await Promise.all([
    supabase
      .from('deal_participants')
      .select('role, company:companies(name)')
      .eq('owner_id', user.id)
      .eq('deal_id', deal.id),

    supabase
      .from('documents')
      .select('id, doc_type, name, status, expiry_date, visibility_stage_index, storage_object_path')
      .eq('owner_id', user.id)
      .eq('linked_deal_id', deal.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('deal_tasks')
      .select('id, title, due_at, priority, status')
      .eq('owner_id', user.id)
      .eq('deal_id', deal.id)
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(12),

    supabase
      .from('logistics_routes')
      .select('*')
      .eq('owner_id', user.id)
      .eq('deal_id', deal.id),

    supabase
      .from('constraints')
      .select('*')
      .eq('owner_id', user.id)
      .eq('deal_id', deal.id),
  ])

  const participantList: { role: string; name: string }[] = (participants || []).map((p: any) => ({
    role: p.role,
    name: p.company?.name || '—',
  }))

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{deal.deal_code}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Stage {deal.stage_index} • {deal.stage} • {deal.commodity}
          </p>
        </div>
        <div className="text-right">
          <Link href="/pentracore/deals/pipeline" className="text-indigo-300 hover:text-indigo-200 text-sm">
            Back to pipeline →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 xl:col-span-2 space-y-3">
          <div className="text-white font-medium">Core Deal Terms</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Grade / Spec</div>
              <div className="text-white font-medium mt-1">{deal.grade_spec || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Quantity</div>
              <div className="text-white font-medium mt-1">{formatMaybeNumber(deal.volume)} MT</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Basis</div>
              <div className="text-white font-medium mt-1">{deal.basis || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Price</div>
              <div className="text-white font-medium mt-1">
                {deal.price_zar_per_mt ? `ZAR ${deal.price_zar_per_mt}/MT` : '—'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Incoterm</div>
              <div className="text-white font-medium mt-1">{deal.incoterm || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Payment Instrument</div>
              <div className="text-white font-medium mt-1">{deal.payment_instrument || '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Estimated GMV</div>
              <div className="text-white font-medium mt-1">{deal.estimated_gmv ? `ZAR ${deal.estimated_gmv}` : '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Estimated Commission</div>
              <div className="text-white font-medium mt-1">{deal.estimated_commission ? `ZAR ${deal.estimated_commission}` : '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0b1220] border border-[#1e293b]">
              <div className="text-slate-400 text-xs">Probability</div>
              <div className="text-white font-medium mt-1">{deal.probability != null ? `${deal.probability}%` : '—'}</div>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs mb-2">Next action</div>
            <div className="text-white text-sm bg-[#0b1220] border border-[#1e293b] rounded-xl p-3">
              {deal.next_action || '—'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs mb-2">Blocker / constraint</div>
            <div className="text-red-200 text-sm bg-[#0b1220] border border-[#1e293b] rounded-xl p-3">
              {deal.blocker || '—'}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
            <div className="text-white font-medium">Participants</div>
            <div className="space-y-2">
              {participantList.length === 0 ? (
                <div className="text-slate-500 text-sm">No participants attached.</div>
              ) : (
                participantList.map((p, i) => (
                  <div key={`${p.role}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="text-slate-400">{p.role}</div>
                    <div className="text-white truncate">{p.name}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
            <div className="text-white font-medium">Location / Logistics</div>
            <div className="text-slate-500 text-sm">
              Origin region: <span className="text-slate-300">{deal.origin_region || '—'}</span>
            </div>
            <div className="text-slate-500 text-sm">
              Origin country: <span className="text-slate-300">{deal.origin_country || '—'}</span>
            </div>
            <div className="text-slate-500 text-sm">
              Destination: <span className="text-slate-300">{deal.destination_country || '—'} {deal.destination_port || ''}</span>
            </div>
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="text-white font-medium">Documents</div>
          <div className="space-y-2">
            {(documents || []).length === 0 ? (
              <div className="text-slate-500 text-sm">No documents linked yet.</div>
            ) : (
              (documents || []).map((d: any) => (
                <div key={d.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{d.name}</div>
                    <div className="text-slate-500 text-xs mt-1">{d.doc_type} • visibility ≥ {d.visibility_stage_index}</div>
                  </div>
                  <div className="text-slate-400 text-xs whitespace-nowrap">
                    {d.expiry_date ? `Exp ${d.expiry_date}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="text-white font-medium">Execution Tasks</div>
          <div className="space-y-2">
            {(tasks || []).length === 0 ? (
              <div className="text-slate-500 text-sm">No tasks tracked.</div>
            ) : (
              (tasks || []).map((t: any) => (
                <div key={t.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                  <div className="text-white text-sm font-medium">{t.title}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    Due {t.due_at ? new Date(t.due_at).toLocaleDateString() : '—'} • {t.priority} • {t.status}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <div className="text-white font-medium mb-2">Constraints</div>
            <div className="space-y-2">
              {(constraints || []).length === 0 ? (
                <div className="text-slate-500 text-sm">No constraints recorded.</div>
              ) : (
                (constraints || []).map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                    <div className="text-white text-sm font-medium truncate">{c.constraint_type}</div>
                    <div className="text-slate-500 text-xs mt-1">{c.details || '—'}</div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      Severity: {c.severity} • Permits required: {c.permits_required ? 'yes' : 'no'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

