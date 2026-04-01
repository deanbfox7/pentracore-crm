import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows, mapping, filename } = await req.json()

  let imported = 0, duplicates = 0, failed = 0

  const BATCH_SIZE = 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const toInsert = []

    for (const row of batch) {
      const getValue = (key: string) => mapping[key] ? row[mapping[key]]?.trim() || null : null
      const firstName = getValue('first_name')
      const lastName = getValue('last_name')
      const companyName = getValue('company_name')
      const country = getValue('country')

      if (!firstName || !lastName || !companyName || !country) { failed++; continue }

      const email = getValue('email')

      // Check duplicate
      if (email) {
        const { data: existing } = await supabase.from('leads').select('id').eq('owner_id', user.id).eq('email', email).single()
        if (existing) { duplicates++; continue }
      }

      const rawCommodities = getValue('commodities_of_interest')
      const commodities = rawCommodities ? rawCommodities.split(',').map((c: string) => c.trim()).filter(Boolean) : []

      toInsert.push({
        owner_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: getValue('phone'),
        linkedin_url: getValue('linkedin_url'),
        company_name: companyName,
        company_website: getValue('company_website'),
        industry: getValue('industry'),
        company_size: getValue('company_size'),
        country,
        city: getValue('city'),
        commodities_of_interest: commodities,
        estimated_volume: getValue('estimated_volume'),
        estimated_deal_value: getValue('estimated_deal_value') ? parseFloat(getValue('estimated_deal_value')!) : null,
        notes: getValue('notes'),
        source: 'csv_import',
        source_detail: filename,
        stage: 'new',
        lead_score: 0,
        tags: [],
        currency: 'USD',
      })
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('leads').insert(toInsert)
      if (error) failed += toInsert.length
      else imported += toInsert.length
    }
  }

  return NextResponse.json({ imported, duplicates, failed })
}
