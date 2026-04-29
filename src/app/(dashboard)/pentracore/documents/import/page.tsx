import DocumentUploadForm from '@/components/pentracore/documents/DocumentUploadForm'

export default function DocumentImportPage() {
  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Document Center Import</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload contracts/LOIs/assays/transport docs into Supabase Storage and catalog them in the CRM.
        </p>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
        <DocumentUploadForm />
      </div>
    </div>
  )
}

