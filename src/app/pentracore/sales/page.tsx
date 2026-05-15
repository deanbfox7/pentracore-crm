/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SalesBotClient from './SalesBotClient'

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: leads } = await supabase
    .from('leads')
    .select('id, first_name, last_name, email, phone, country, commodities_of_interest')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const prospects = (leads || []).map((lead: any) => ({
    id: lead.id,
    name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email || 'Prospect',
    email: lead.email || '',
    phone: lead.phone || '',
    commodity: lead.commodities_of_interest?.[0] || 'Minerals',
    country: lead.country || '',
  }))

  return <SalesBotClient prospects={prospects} />
}
