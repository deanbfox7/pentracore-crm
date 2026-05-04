'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Health = {
  ok: boolean
  project: {
    ref: string
    host: string | null
  }
  env: Record<string, { present: boolean; length: number }>
  checks: {
    envReady: boolean
    productsReadable: boolean
    productCount: number | null
    error: string | null
  }
}

const schemas = [
  {
    name: 'pentracore_knowledge',
    status: 'Required',
    tables: ['company_info', 'products', 'services', 'processes', 'policies', 'faqs', 'contacts', 'kpi_dashboard'],
    purpose: 'Company knowledge, products, processes, policies, FAQs, and market material.',
  },
  {
    name: 'dean_crm',
    status: 'Required',
    tables: ['leads', 'opportunities', 'counterparties', 'deals', 'deal_timeline', 'deal_documents', 'task_log'],
    purpose: 'Private CRM pipeline, deal tracking, counterparties, and operational tasks.',
  },
  {
    name: 'audit',
    status: 'Recommended',
    tables: ['access_log', 'knowledge_changelog'],
    purpose: 'Change tracking and access history for compliance visibility.',
  },
]

const setupSteps = [
  ['1', 'Supabase keys', 'Fill Vercel Production and Preview env values. Do not leave blank variables.'],
  ['2', 'Database SQL', 'Run supabase/manual/complete_dashboard_deploy.sql in the Supabase SQL editor.'],
  ['3', 'Redeploy', 'Run npx vercel --prod so the app receives the latest environment values.'],
  ['4', 'Verify', 'Run bash scripts/verify-live.sh and confirm the API returns HTTP 200.'],
]

const envRows = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'Public', 'Project REST URL used by browser and server routes.'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Public', 'Public anon/publishable key used for client-safe reads.'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Secret', 'Server-only admin key. Never expose this in browser UI or docs.'],
]

const quickLinks = [
  ['Supabase API settings', 'https://supabase.com/dashboard/project/gwytwgdedfazwrxosmxh/settings/api'],
  ['Supabase SQL editor', 'https://supabase.com/dashboard/project/gwytwgdedfazwrxosmxh/sql/new'],
  ['Vercel env vars', 'https://vercel.com/deanbfox-8260s-projects/pentracore-crm/settings/environment-variables'],
]

function StatusPill({ state }: { state: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const styles = {
    good: { background: '#e7f7ee', color: '#176b3a', border: '#b9e7ca' },
    warn: { background: '#fff7df', color: '#7a5400', border: '#f0d37a' },
    bad: { background: '#fdeaea', color: '#9d1c1c', border: '#efb8b8' },
    neutral: { background: '#eef2f6', color: '#425064', border: '#d8e0e9' },
  }[state]

  const label = {
    good: 'Ready',
    warn: 'Action needed',
    bad: 'Failing',
    neutral: 'Planned',
  }[state]

  return (
    <span style={{ ...styles, border: `1px solid ${styles.border}`, borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  )
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: string[][]
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr style={{ background: '#f1f4f8', borderBottom: '1px solid #d9e1ea' }}>
            {columns.map((column) => (
              <th key={column} style={thStyle}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #edf0f3' }}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} style={tdStyle}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle = {
  padding: '11px 13px',
  textAlign: 'left' as const,
  fontSize: 12,
  color: '#354152',
  letterSpacing: 0,
  textTransform: 'uppercase' as const,
}

const tdStyle = {
  padding: '12px 13px',
  verticalAlign: 'top' as const,
  fontSize: 14,
  lineHeight: 1.45,
}

export default function SupabaseInfoPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/supabase/health')
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => {
        setHealth(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const envReady = health?.checks.envReady || false
  const productsReady = health?.checks.productsReadable || false
  const overallState = productsReady ? 'good' : envReady ? 'warn' : 'bad'

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <h1>Supabase Control Room</h1>
            <StatusPill state={loading ? 'neutral' : overallState} />
          </div>
          <p style={{ color: '#5d6878', maxWidth: 820 }}>
            Operational view for PentraCore CRM database wiring, schema coverage, and deployment checks.
          </p>
        </div>
        <Link href="/" style={{ padding: '8px 14px', borderRadius: 4, background: '#1d4f8f', color: 'white', whiteSpace: 'nowrap' }}>
          Home
        </Link>
      </div>

      <section className="card" style={{ borderLeft: `5px solid ${productsReady ? '#2f9d62' : '#cc8a00'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <h2>Live Connection</h2>
          <button type="button" onClick={() => window.location.reload()} style={{ background: '#eef2f6', color: '#243041', border: '1px solid #d9e1ea' }}>
            Refresh
          </button>
        </div>
        <div className="grid">
          <div>
            <div style={labelStyle}>Environment</div>
            <div style={valueStyle}>{loading ? 'Checking...' : envReady ? 'Supabase env values present' : 'Supabase env values missing or blank'}</div>
          </div>
          <div>
            <div style={labelStyle}>Products API</div>
            <div style={valueStyle}>{loading ? 'Checking...' : productsReady ? `Readable (${health?.checks.productCount || 0} rows)` : 'Not readable yet'}</div>
          </div>
          <div>
            <div style={labelStyle}>Project</div>
            <div style={valueStyle}>{health?.project.host || 'gwytwgdedfazwrxosmxh.supabase.co'}</div>
          </div>
        </div>
        {!loading && health?.checks.error && (
          <div className="alert alert-error" style={{ marginTop: 16, marginBottom: 0 }}>
            {health.checks.error}
          </div>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 14 }}>Environment Variables</h2>
        <DataTable
          columns={['Name', 'Scope', 'Purpose']}
          rows={envRows.map(([name, scope, purpose]) => {
            const meta = health?.env[name]
            const state = meta?.present && meta.length > 2 ? 'set' : 'blank/missing'
            return [name, scope, `${purpose} Current status: ${state}.`]
          })}
        />
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 14 }}>Deployment Steps</h2>
        <DataTable columns={['Step', 'Area', 'Action']} rows={setupSteps} />
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 14 }}>Schemas And Tables</h2>
        <DataTable
          columns={['Schema', 'Status', 'Tables', 'Purpose']}
          rows={schemas.map((schema) => [schema.name, schema.status, schema.tables.join(', '), schema.purpose])}
        />
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 14 }}>Safe Admin Links</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {quickLinks.map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" style={{ padding: '9px 12px', border: '1px solid #d9e1ea', borderRadius: 4, background: '#f8fafc', color: '#1d4f8f', fontWeight: 700 }}>
              {label}
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}

const labelStyle = {
  fontSize: 12,
  color: '#657182',
  textTransform: 'uppercase' as const,
  marginBottom: 7,
}

const valueStyle = {
  fontSize: 16,
  fontWeight: 700,
  overflowWrap: 'anywhere' as const,
}
