import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function cleanText(input: unknown) {
  const s = typeof input === 'string' ? input : input == null ? '' : String(input)
  return s.replace(/\s+/g, ' ').trim()
}

function parseStageIndex(stageRaw: string): { stage: string; stage_index: number } {
  const s = cleanText(stageRaw).toLowerCase()
  // Master tracker uses patterns like:
  // - "4 LOI prep"
  // - "1 to 2 NCNDA"
  // - "3 KYC partial"
  const m = s.match(/\b(10|11|[1-9])\b/)
  const stageIndex = m ? Number(m[1]) : 1

  // Canonical stage names (aligns with your 06_pipeline_stages.md)
  const stageByIndex: Record<number, string> = {
    1: 'inquiry',
    2: 'ncn_da_exchanged',
    3: 'kyc_sanctions_cleared',
    4: 'soft_offer_aligned',
    5: 'hard_offer_proofs_exchanged',
    6: 'contract_drafted_spa',
    7: 'banking_in_motion',
    8: 'inspection_assay',
    9: 'shipment_logistics',
    10: 'payment_commission_settled',
    11: 'repeat_deal_nurture',
  }

  return { stage: stageByIndex[stageIndex] ?? 'inquiry', stage_index: stageIndex }
}

function parseSide(sideRaw: string): 'buy' | 'sell' | 'match' {
  const s = cleanText(sideRaw).toLowerCase()
  if (s.includes('buy')) return 'buy'
  if (s.includes('sell')) return 'sell'
  return 'match'
}

function parseNumericMaybe(valueRaw: unknown): number | null {
  const s = cleanText(valueRaw)
  if (!s) return null
  // Extract the first number-like substring (handles "R1,150" / "50,000+ t/m")
  const m = s.match(/(\d[\d,]*)(?:\.(\d+))?/)
  if (!m) return null
  const whole = m[1].replace(/,/g, '')
  const frac = m[2] ? `.${m[2]}` : ''
  const num = Number(`${whole}${frac}`)
  return Number.isFinite(num) ? num : null
}

function deriveParticipantRole(counterpartyRaw: string, side: 'buy' | 'sell') {
  const cp = cleanText(counterpartyRaw).toUpperCase()
  if (cp.includes('BUYER')) return 'buyer'
  if (cp.includes('SUPPLIER') || cp.includes('MINE') || cp.includes('SELLER')) return 'seller'
  // Fallback:
  // - If the deal is "Buy-side", the counterparty is typically the buyer.
  // - If "Sell-side", the counterparty is typically the buyer (because PentraCore is selling to them).
  // Your tracker conventions show the counterparty field already includes buyer/supplier hints.
  return side === 'buy' ? 'buyer' : 'buyer'
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { rows, filename } = body as { rows?: Record<string, unknown>[]; filename?: string }
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'Missing rows[]' }, { status: 400 })
  }

  const BATCH_SIZE = 20
  let dealsInserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    // 1) Insert/update deals
    const dealsToUpsert = batch.map((row) => {
      const dealCode = cleanText(row['Deal Code'])
      const stageRaw = cleanText(row['Stage'])
      const side = parseSide(cleanText(row['Side']))

      const { stage, stage_index } = parseStageIndex(stageRaw)
      const commodity = cleanText(row['Commodity'])
      const grade_spec = cleanText(row['Grade'])
      const basis = cleanText(row['Basis'])
      const term = cleanText(row['Term'])
      const counterparty = cleanText(row['Counterparty'])

      const volume = parseNumericMaybe(row['Volume']) ?? 0
      const price_zar_per_mt = parseNumericMaybe(row['Price ZAR per MT'])
      const incoterm = cleanText(row['Basis']) // fallback; your tracker may not always match incoterm
      const payment_instrument = cleanText(row['Pay Instrument'])

      // Location is often descriptive (e.g. "Rustenburg"), not strict country/region.
      const origin_region = cleanText(row['Location'])

      return {
        owner_id: user.id,
        deal_code: dealCode,
        stage,
        stage_index,
        side,
        commodity,
        grade_spec,
        basis,
        term,
        origin_region,
        volume,
        uom: 'MT',
        price_zar_per_mt,
        currency: 'ZAR',
        incoterm,
        payment_instrument,
        next_action: cleanText(row['Next Action']),
        blocker: cleanText(row['Blocker']),
        last_activity_at: new Date().toISOString(),
        estimated_gmv: price_zar_per_mt != null ? price_zar_per_mt * volume : null,
      }
    }).filter(d => d.deal_code)

    if (dealsToUpsert.length) {
      const { error } = await supabase
        .from('deals')
        .upsert(dealsToUpsert, { onConflict: 'deal_code' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      dealsInserted += dealsToUpsert.length
    }

    // 2) Insert participants for each deal (counterparty as buyer/seller hint)
    // We keep this simple: create/find companies by exact name and attach a deal_participant row.
    for (const row of batch) {
      const dealCode = cleanText(row['Deal Code'])
      const counterpartyName = cleanText(row['Counterparty'])
      const contactName = cleanText(row['Contact'])
      const phone = cleanText(row['Phone'])
      if (!dealCode || !counterpartyName) continue

      const { data: dealRows, error: dealErr } = await supabase
        .from('deals')
        .select('id, side')
        .eq('owner_id', user.id)
        .eq('deal_code', dealCode)
        .maybeSingle()

      if (dealErr || !dealRows) continue

      const participantRole = deriveParticipantRole(counterpartyName, dealRows.side as any)

      // Find/create company
      const companyName = counterpartyName.split('(')[0].trim() || counterpartyName
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', companyName)
        .maybeSingle()

      let companyId = existingCompany?.id
      if (!companyId) {
        const typeGuess =
          participantRole === 'buyer' ? 'buyer' :
          participantRole === 'seller' ? 'supplier' : 'broker'

        const { data: createdCompany, error: createErr } = await supabase
          .from('companies')
          .insert({
            owner_id: user.id,
            name: companyName,
            type: typeGuess,
            notes: phone ? `Phone: ${phone}` : undefined,
          })
          .select('id')
          .single()

        if (createErr || !createdCompany) continue
        companyId = createdCompany.id
      }

      // Upsert participant row (no unique constraint, so we just avoid duplicates best-effort)
      const { data: existingParticipant } = await supabase
        .from('deal_participants')
        .select('id')
        .eq('owner_id', user.id)
        .eq('deal_id', dealRows.id)
        .eq('company_id', companyId)
        .eq('role', participantRole)
        .maybeSingle()

      if (existingParticipant) continue

      const { error: partErr } = await supabase.from('deal_participants').insert({
        owner_id: user.id,
        deal_id: dealRows.id,
        company_id: companyId,
        role: participantRole,
        mask_before_stage: true,
        visibility_stage_index: 6,
      })

      if (partErr) {
        // Don't fail the entire import for participant issues
        // eslint-disable-next-line no-console
        console.warn('participant insert failed', partErr.message)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    imported_deals: dealsInserted,
    filename: filename ?? null,
  })
}

