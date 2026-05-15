import { SupabaseClient } from '@supabase/supabase-js'

export interface CounterpartyResolved {
  id: number
  company_name: string
  contact_name?: string
  email: string
}

export async function resolveCounterparty(
  supabaseAdmin: SupabaseClient,
  counterpartyId: number
): Promise<CounterpartyResolved | null> {
  try {
    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('counterparties')
      .select('id, company_name, contact_name, email')
      .eq('id', counterpartyId)
      .single()

    if (error || !data) {
      return null
    }

    if (!data.email) {
      return null
    }

    return data as CounterpartyResolved
  } catch (err: any) {
    return null
  }
}
