import ImportWizard from '@/components/leads/ImportWizard'

export default function ImportPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-white mb-1">Import Leads</h1>
      <p className="text-slate-500 text-sm mb-6">Upload a CSV or Excel file from LinkedIn, Apollo, or any source</p>
      <ImportWizard />
    </div>
  )
}
