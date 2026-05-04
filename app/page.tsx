'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('deanbfox@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loginMode, setLoginMode] = useState<'magic' | 'password'>('magic')
  const { user, loading: authLoading, signInWithMagicLink } = useAuth()
  const router = useRouter()

  // If already logged in, redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/knowledge')
    }
  }, [user, authLoading, router])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await signInWithMagicLink(email)
      setMessage('✓ Check your email for login link (valid for 24 hours)')
      setEmail('')
    } catch (err: any) {
      setMessage(`✗ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/auth/master-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setMessage('✓ Logging in...')
      setPassword('')

      setTimeout(() => {
        router.push('/knowledge')
      }, 1000)
    } catch (err: any) {
      setMessage(`✗ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
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
      <div style={{ maxWidth: '400px', margin: '60px auto' }}>
        <h1>PentraCore Intelligence Suite</h1>
        <p style={{ marginBottom: '30px', color: '#666', fontSize: '14px' }}>
          Mining deals made simple.
        </p>

        {message && (
          <div
            className={`alert ${
              message.includes('✗') ? 'alert-error' : 'alert-success'
            }`}
            style={{ marginBottom: '20px' }}
          >
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setLoginMode('magic')}
            style={{
              flex: 1,
              padding: '10px',
              background: loginMode === 'magic' ? '#333' : '#f5f5f5',
              color: loginMode === 'magic' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Magic Link
          </button>
          <button
            onClick={() => setLoginMode('password')}
            style={{
              flex: 1,
              padding: '10px',
              background: loginMode === 'password' ? '#333' : '#f5f5f5',
              color: loginMode === 'password' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Password
          </button>
        </div>

        {loginMode === 'magic' ? (
          <>
            <form onSubmit={handleMagicLink}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', marginBottom: '20px' }}
              >
                {loading ? 'Sending link...' : 'Send Magic Link'}
              </button>
            </form>
            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              We'll send you a secure link via email. Click it to log in.
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handlePasswordLogin}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '15px' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', marginBottom: '20px' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              Master password login for deanbfox@gmail.com only.
            </p>
          </>
        )}

        <hr style={{ margin: '30px 0', borderColor: '#eee' }} />

        <p style={{ fontSize: '13px', color: '#666' }}>
          <strong>Quick access:</strong> <code style={{ background: '#f5f5f5', padding: '2px 4px' }}>deanbfox@gmail.com</code> with password
        </p>
      </div>
    </div>
  )
}
