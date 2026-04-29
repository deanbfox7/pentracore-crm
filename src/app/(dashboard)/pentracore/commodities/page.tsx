import Link from 'next/link'

const COMMODITIES: { slug: string; label: string }[] = [
  { slug: 'copper', label: 'Copper' },
  { slug: 'chrome', label: 'Chrome' },
  { slug: 'lithium', label: 'Lithium' },
  { slug: 'cobalt', label: 'Cobalt' },
  { slug: 'gold', label: 'Gold' },
  { slug: 'silver', label: 'Silver' },
  { slug: 'manganese', label: 'Manganese' },
  { slug: 'zinc', label: 'Zinc' },
  { slug: 'coal', label: 'Coal' },
]

export default function CommoditiesIndexPage() {
  return (
    <div className="p-6 max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Commodity Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">Deal flow, pricing reference, assay signals, and supply-vs-demand views.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMMODITIES.map((c, idx) => (
          <Link
            key={c.slug}
            href={`/pentracore/commodities/${c.slug}`}
            className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 hover:border-indigo-500/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white font-medium">{c.label}</div>
                <div className="text-slate-500 text-xs mt-1">Focus area</div>
              </div>
              <div className="text-slate-600 text-sm">#{idx + 1}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

