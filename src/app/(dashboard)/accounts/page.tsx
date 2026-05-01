import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Company, Contact } from '@/types'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [companiesResult, contactsResult] = await Promise.all([
    supabase.from('companies').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('contacts').select('*, company:companies(name)').eq('owner_id', user.id).order('updated_at', { ascending: false }),
  ])

  const companies: Company[] = companiesResult.data || []
  const contacts: (Contact & { company?: { name?: string } | null })[] = contactsResult.data || []

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Accounts & Contacts</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage buyers, suppliers, brokers, and decision-makers</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">Companies ({companies.length})</h2>
          <div className="space-y-2 text-sm">
            {companies.length === 0 && <p className="text-slate-500">No companies yet.</p>}
            {companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between rounded-lg bg-[#0d1420] border border-[#1e293b] px-3 py-2">
                <span className="text-slate-200">{company.name}</span>
                <span className="text-xs text-indigo-300 capitalize">{company.type}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">Contacts ({contacts.length})</h2>
          <div className="space-y-2 text-sm">
            {contacts.length === 0 && <p className="text-slate-500">No contacts yet.</p>}
            {contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg bg-[#0d1420] border border-[#1e293b] px-3 py-2">
                <div className="text-slate-100">{contact.first_name} {contact.last_name}</div>
                <div className="text-xs text-slate-400">{contact.company?.name || 'Unassigned company'}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
