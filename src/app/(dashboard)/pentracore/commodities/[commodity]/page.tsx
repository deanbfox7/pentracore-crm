/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const COMMODITY_LABELS: Record<string, string> = {
  copper: 'Copper',
  chrome: 'Chrome',
  lithium: 'Lithium',
  cobalt: 'Cobalt',
  gold: 'Gold',
  silver: 'Silver',
  manganese: 'Manganese',
  zinc: 'Zinc',
  coal: 'Coal',
}

export default async function CommodityDetailPage({ params }: { params: { commodity: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const commoditySlug = String(params.commodity || '').toLowerCase()
  const commodityLabel = COMMODITY_LABELS[commoditySlug] || commoditySlug

  // Deal set for this commodity (string match; tracker uses long spec strings)
  const { data: deals } = await supabase
    .from('deals')
    .select('id, deal_code, stage_index, stage, commodity, grade_spec, volume, price_zar_per_mt, estimated_gmv, estimated_commission, probability, side, next_action, blocker')
    .eq('owner_id', user.id)
    .ilike('commodity', `%${commodityLabel}%`)
    .order('stage_index', { ascending: true })

  const { data: pricebookRows } = await supabase
    .from('pricebook')
    .select('id, grade, basis, price_zar_per_mt, pay_instrument, as_of_date, source')
    .eq('owner_id', user.id)
    .ilike('commodity', `%${commodityLabel}%')
    .order('as_of_date', { ascending: false })
    .limit(6)

  const dealIds = (deals || []).map((d: any) => d.id)

  const { data: assayRows } = await supabase
    .from('assay_results')
    .select('id, deal_id, commodity, grade_value, units, tested_at, notes')
    .eq('owner_id', user.id)
    .in('deal_id', dealIds.length ? dealIds : ['00000000-0000-0000-0000-000000000000'])
    .order('tested_at', { ascending: false })
    .limit(25)

  // Supply vs demand:
  // - "sell" = supply candidate
  // - "buy" = demand candidate
  const supplyVolume = (deals || []).filter((d: any) => d.side === 'sell').reduce((s: number, d: any) => s + Number(d.volume || 0), 0)
  const demandVolume = (deals || []).filter((d: any) => d.side === 'buy').reduce((s: number, d: any) => s + Number(d.volume || 0), 0)

  const supplyDemand = [
    { name: 'Supply', value: supplyVolume },
    { name: 'Demand', value: demandVolume },
  ]

  const avgDealPrice = (deals || []).reduce((sum: number, d: any) => sum + Number(d.price_zar_per_mt || 0), 0)
  const avgDealPriceDen = (deals || []).filter((d: any) => d.price_zar_per_mt != null).length
  const avgDealPriceValue = avgDealPriceDen ? avgDealPrice / avgDealPriceDen : null

  const bestPriceRow = (pricebookRows || [])[0] as any | undefined
  const marketPrice = bestPriceRow?.price_zar_per_mt ?? avgDealPriceValue

  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{commodityLabel} Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">Current deals, market pricing reference, assay/test signals, and supply vs demand.</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-slate-500">Market price (ZAR/MT)</div>
          <div className="text-white font-semibold mt-1">
            {marketPrice != null
              ? 'ZAR ' + Number(marketPrice).toLocaleString()
              : '—'}
          </div>
          {bestPriceRow?.as_of_date && (
            <div className="text-slate-500 text-xs mt-1">
              As of {new Date(bestPriceRow.as_of_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 xl:col-span-2 space-y-3">
          <div className="text-white font-medium">Current Deals</div>
          {(deals || []).length === 0 ? (
            <div className="text-slate-500 text-sm">No deals detected for this commodity yet.</div>
          ) : (
            <div className="space-y-2">
              {(deals || []).map((d: any) => (
                <div key={d.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{d.deal_code}</div>
                    <div className="text-slate-500 text-xs mt-1">Stage {d.stage_index} • {d.grade_spec || '—'}</div>
                    <div className="text-slate-400 text-xs mt-2 line-clamp-2">{d.next_action || d.blocker || ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-200 text-sm font-semibold">
                      {d.probability != null ? Math.round(d.probability) + '%' : '—'}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {d.volume != null ? String(d.volume) + ' MT' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <div className="text-white font-medium mb-2">Supply vs Demand</div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplyDemand} barSize={60}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#eab308" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
            <div className="text-white font-medium mb-2">Price Book (reference)</div>
            {(pricebookRows || []).length === 0 ? (
              <div className="text-slate-500 text-sm">No pricebook entries yet.</div>
            ) : (
              <div className="space-y-2">
                {(pricebookRows || []).map((p: any) => (
                  <div key={p.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                    <div className="text-white text-sm font-medium">{p.grade || commodityLabel}</div>
                    <div className="text-slate-500 text-xs mt-1">{p.basis || '—'}</div>
                    <div className="text-yellow-200 text-sm font-semibold mt-2">
                      ZAR {p.price_zar_per_mt}/MT
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
        <div className="text-white font-medium">Assay / Testing Data</div>
        {(assayRows || []).length === 0 ? (
          <div className="text-slate-500 text-sm">No assay results logged yet for this commodity.</div>
        ) : (
          <div className="space-y-2">
            {(assayRows || []).map((a: any) => (
              <div key={a.id} className="rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
                <div className="text-white text-sm font-medium">{a.grade_value || '—'}</div>
                <div className="text-slate-500 text-xs mt-1">
                  Tested {a.tested_at ? new Date(a.tested_at).toLocaleDateString() : '—'} • {a.units || ''}
                </div>
                {a.notes && <div className="text-slate-400 text-xs mt-2 line-clamp-2">{a.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

