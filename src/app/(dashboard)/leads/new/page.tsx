import LeadForm from '@/components/leads/LeadForm'

export default function NewLeadPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-white mb-1">Add Lead</h1>
      <p className="text-slate-500 text-sm mb-6">Manually add a new lead to your CRM</p>
      <LeadForm />
    </div>
  )
}
