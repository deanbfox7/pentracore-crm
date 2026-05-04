'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface Lead {
  id: number
  first_name: string
  last_name: string
  email: string
  company: string
  lead_status: string
}

interface Opportunity {
  id: number
  title: string
  commodity: string
  tonnage: number
  stage: string
  expected_commission: number
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, session, signOut } = useAuth()
  const router = useRouter()

  // Only Dean can access
  useEffect(() => {
    if (!session) {
      router.push('/')
      return
    }

    if (user?.email !== 'deanbfox@gmail.com') {
      router.push('/knowledge')
      return
    }

    fetchData()
  }, [user, session, router])

  async function fetchData() {
    try {
      setError('')

      const token = session?.access_token
      const headers = { Authorization: `Bearer ${token}` }

      const [leadsRes, oppsRes] = await Promise.all([
        fetch('/api/crm/leads', { headers }),
        fetch('/api/crm/opportunities', { headers }),
      ])

      if (!leadsRes.ok) {
        const err = await leadsRes.json()
        throw new Error(err.error || 'Failed to load leads')
      }

      if (!oppsRes.ok) {
        const err = await oppsRes.json()
        throw new Error(err.error || 'Failed to load opportunities')
      }

      setLeads(await leadsRes.json())
      setOpportunities(await oppsRes.json())
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Loading your CRM...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div>
          <h1>Your CRM Dashboard</h1>
          <p style={{ color: '#666', fontSize: '13px' }}>Logged in as: {user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/knowledge"
            style={{
              padding: '8px 16px',
              background: '#666',
              color: 'white',
              borderRadius: '4px',
              display: 'inline-block',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Knowledge Base
          </Link>
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              background: '#c00',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <Link
          href="/crm"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3>Leads ({leads.length})</h3>
          <p style={{ color: '#666', fontSize: '13px' }}>Active prospects</p>
        </Link>
        <Link
          href="/crm"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3>Opportunities ({opportunities.length})</h3>
          <p style={{ color: '#666', fontSize: '13px' }}>Active deals in pipeline</p>
        </Link>
        <Link
          href="/crm/analytics"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3>Analytics</h3>
          <p style={{ color: '#666', fontSize: '13px' }}>View deal metrics</p>
        </Link>
      </div>

      <div className="card">
        <h2>Leads</h2>
        {leads.length === 0 ? (
          <p style={{ color: '#666' }}>
            No leads yet.{' '}
            <Link href="#" style={{ color: '#0066cc' }}>
              Add your first lead
            </Link>
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td style={{ padding: '10px' }}>{lead.company}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{lead.email}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{lead.lead_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Opportunities</h2>
        {opportunities.length === 0 ? (
          <p style={{ color: '#666' }}>No opportunities yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Commodity</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Tonnage</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Stage</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Est. Commission</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{opp.title}</td>
                  <td style={{ padding: '10px' }}>{opp.commodity}</td>
                  <td style={{ padding: '10px' }}>{opp.tonnage}</td>
                  <td style={{ padding: '10px', fontSize: '13px' }}>{opp.stage}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                    ${opp.expected_commission?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
