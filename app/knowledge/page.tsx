'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface Product {
  id: number
  name: string
  category: string
  description: string
  pricing_per_unit: number
  unit: string
}

export default function KnowledgePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user, session, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      fetchProducts()
    }
  }, [authLoading, user, router])

  async function fetchProducts() {
    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/knowledge/products', {
        headers,
      })

      if (!res.ok) {
        throw new Error('Access denied')
      }

      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container">
        <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
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
          <h1>PentraCore Knowledge Base</h1>
          {user && <p style={{ color: '#666', fontSize: '13px' }}>Logged in as: {user.email}</p>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user?.email === 'deanbfox@gmail.com' && (
            <Link
              href="/crm"
              style={{
                padding: '8px 16px',
                background: '#0066cc',
                color: 'white',
                borderRadius: '4px',
                display: 'inline-block',
                fontSize: '14px',
              }}
            >
              Your CRM
            </Link>
          )}
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              background: '#666',
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

      <div className="card">
        <h2>Products & Services</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#666' }}>
            No products found. Seed your knowledge base in Supabase to get started.
          </p>
        ) : (
          <div className="grid">
            {products.map((product) => (
              <div key={product.id} className="card">
                <h3>{product.name}</h3>
                <p style={{ color: '#666', marginBottom: '10px' }}>{product.category}</p>
                <p>{product.description}</p>
                {product.pricing_per_unit && (
                  <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                    ${product.pricing_per_unit} / {product.unit}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
