import { createClient } from '@/lib/supabase/server'
import AppointmentsClient from './AppointmentsClient'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [appointmentsResult, leadsResult] = await Promise.all([
    supabase.from('appointments').select('*, lead:leads(first_name, last_name, company_name, email, phone)').eq('owner_id', user!.id).order('start_time'),
    supabase.from('leads').select('id, first_name, last_name, company_name').eq('owner_id', user!.id).order('company_name'),
  ])

  return <AppointmentsClient appointments={appointmentsResult.data || []} leads={leadsResult.data || []} />
}
