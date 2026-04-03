import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadsClient from './LeadsClient'

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ stage?: string; search?: string; commodity?: string; sort?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('leads')
    .select('*')
    .eq('owner_id', user!.id)

  if (params.stage) query = query.eq('stage', params.stage)
  if (params.search) query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,company_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  if (params.commodity) query = query.contains('commodities_of_interest', [params.commodity])

  const sort = params.sort || 'created_at'
  query = query.order(sort, { ascending: false })

  const { data: leads } = await query

  return <LeadsClient leads={leads || []} />
}
