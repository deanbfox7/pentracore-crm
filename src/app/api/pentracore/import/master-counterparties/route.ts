import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function cleanText(input: unknown) {
  const s = typeof input === 'string' ? input : input == null ? '' : String(input)
  return s.replace(/\s+/g, ' ').trim()
}

function guessCompanyType(typeRaw: string) {
  const t = cleanText(typeRaw).toLowerCase()
  if (t.includes('buyer')) return 'buyer'
  if (t.includes('supplier') || t.includes('mine') || t.includes('refinery')) return 'supplier'
  return 'broker'
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { rows, filename } = body as { rows?: Record<string, unknown>[]; filename?: string }
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'Missing rows[]' }, { status: 400 })

  const BATCH_SIZE = 40
  let companiesUpserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    const toUpsert = batch
      .map((row) => {
        const type = cleanText(row['Type'])
        const name = cleanText(row['Name'])
        const entityReg = cleanText(row['Entity / Reg'])
        const role = cleanText(row['Role'])
        const kycStatus = cleanText(row['KYC Status'])
        const ncnnda = cleanText(row['NCNDA Status'])
        const tier = cleanText(row['Tier'])
        const notes = cleanText(row['Notes'])

        if (!name) return null

        return {
          owner_id: user.id,
          name,
          type: guessCompanyType(type),
          country: undefined,
          region: undefined,
          notes: [
            entityReg ? `Reg: ${entityReg}` : '',
            role ? `Role: ${role}` : '',
            kycStatus ? `KYC: ${kycStatus}` : '',
            ncnnda ? `NCNDA: ${ncnnda}` : '',
            tier ? `Tier: ${tier}` : '',
            notes ? `Notes: ${notes}` : '',
          ].filter(Boolean).join(' | '),
        }
      })
      .filter(Boolean) as Array<{
        owner_id: string
        name: string
        type: string
        notes?: string
        country?: string
        region?: string
      }>

    if (!toUpsert.length) continue

    // `companies` doesn't have an explicit unique constraint on (owner_id,name),
    // so we do a best-effort upsert: insert-only and skip duplicates by querying in advance.
    // For an MVP import this keeps things straightforward.
    const names = toUpsert.map((c) => c.name)
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name')
      .eq('owner_id', user.id)

    const existingSet = new Set((existing || []).map((e) => String(e.name).toLowerCase()))

    const insert = toUpsert.filter((c) => !existingSet.has(c.name.toLowerCase()))
    if (!insert.length) continue

    const { error } = await supabase.from('companies').insert(insert)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    companiesUpserted += insert.length
  }

  return NextResponse.json({ ok: true, inserted: companiesUpserted, filename: filename ?? null })
}

