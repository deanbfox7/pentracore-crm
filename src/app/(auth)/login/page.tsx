'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shareholderEmail, setShareholderEmail] = useState('')
  const [error, setError] = useState('')
  const [shareholderError, setShareholderError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareholderLoading, setShareholderLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  async function handleShareholderLogin(e: React.FormEvent) {
    e.preventDefault()
    setShareholderLoading(true)
    setShareholderError('')

    try {
      const res = await fetch('/api/shareholders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareholderEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No shareholder found')

      const id = data.shareholder.id
      localStorage.setItem('shareholder_id', id)
      document.cookie = `shareholder_id=${id}; path=/; max-age=2592000; SameSite=Lax`
      router.push(`/shareholder/${id}/chat?shareholder_id=${id}`)
    } catch (err) {
      setShareholderError(err instanceof Error ? err.message : 'Shareholder lookup failed')
    } finally {
      setShareholderLoading(false)
    }
  }

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-white font-semibold text-lg">Pentracore CRM</span>
        </div>
        <p className="text-slate-400 text-sm">Sign in to your account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="you@company.com"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="••••••••"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        No account?{' '}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">Create one</Link>
      </p>

      <div className="my-8 h-px bg-[#1e293b]" />

      <div className="mb-4 text-center">
        <p className="text-white font-medium">Shareholder portal</p>
        <p className="text-slate-500 text-sm mt-1">Use the email linked to your portfolio access.</p>
      </div>

      <form onSubmit={handleShareholderLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Shareholder email</label>
          <input
            type="email"
            value={shareholderEmail}
            onChange={e => setShareholderEmail(e.target.value)}
            required
            placeholder="shareholder@company.com"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {shareholderError && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{shareholderError}</p>}
        <button
          type="submit"
          disabled={shareholderLoading}
          className="w-full bg-[#111827] border border-[#1e293b] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition-colors"
        >
          {shareholderLoading ? 'Checking...' : 'Enter Shareholder Portal'}
        </button>
      </form>
    </div>
  )
}
