import MasterDealTrackerImportWizard from '@/components/pentracore/import/MasterDealTrackerImportWizard'
import MasterCounterpartiesImportWizard from '@/components/pentracore/import/MasterCounterpartiesImportWizard'

export default function PentraCoreImportPage() {
  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">PentraCore Deal Intelligence Import</h1>
        <p className="text-slate-500 text-sm mt-1">
          Import your `MASTER_DEAL_TRACKER.csv` into the new `deals` pipeline schema.
        </p>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
        <div className="space-y-4">
          <MasterDealTrackerImportWizard />
          <div className="h-px bg-[#1e293b]" />
          <MasterCounterpartiesImportWizard />
        </div>
      </div>
    </div>
  )
}

