import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LeadForm from '@/components/leads/LeadForm'

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).eq('owner_id', user!.id).single()
  if (!lead) notFound()

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-1">Edit Lead</h1>
      <p className="text-slate-500 text-sm mb-6">{lead.first_name} {lead.last_name} at {lead.company_name}</p>
      <LeadForm lead={lead} />
    </div>
  )
}
