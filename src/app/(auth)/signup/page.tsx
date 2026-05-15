'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="text-white font-semibold text-lg">Pentracore CRM</span>
        </div>
        <p className="text-slate-400 text-sm">Create your account</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            required placeholder="Dean Fox"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="you@pentracore.com"
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="••••••••" minLength={6}
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition-colors"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
      </p>
    </div>
  )
}
