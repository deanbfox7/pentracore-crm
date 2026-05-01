'use client'

import { FormEvent, useState } from 'react'
import { Send } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function LeadChatClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to PentraCore Trade Intelligence. Are you buying or selling, and which commodity are you working with?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || loading) return

    const nextMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/lead-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 py-6 text-white">
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        <header className="mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold">P</div>
          <h1 className="mt-4 text-3xl font-semibold">PentraCore Trade Intelligence</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Structured mineral trade qualification for buyers, sellers, and mandate holders.
          </p>
        </header>

        <section className="flex flex-1 flex-col rounded-xl border border-[#1e293b] bg-[#111827]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : 'border border-[#1e293b] bg-[#0a0f1a] text-slate-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-slate-500">Qualifying...</div>}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#1e293b] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type commodity, volume, origin, role, or contact details..."
              className="min-w-0 flex-1 rounded-lg border border-[#1e293b] bg-[#0a0f1a] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
