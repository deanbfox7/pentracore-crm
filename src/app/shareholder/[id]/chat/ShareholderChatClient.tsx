'use client'

import { FormEvent, useState } from 'react'
import { Send } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ShareholderChatClient({
  shareholderId,
  shareholderName,
}: {
  shareholderId: string
  shareholderName: string
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Welcome back, ${shareholderName}. How can I help with your portfolio today?`,
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareholder_id: shareholderId, messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Chat failed. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col">
        <header className="mb-4 border-b border-[#1e293b] pb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-indigo-300">PentraCore Shareholder Portal</div>
          <h1 className="mt-2 text-2xl font-semibold">{shareholderName}</h1>
          <p className="mt-1 text-sm text-slate-400">Private portfolio assistant</p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-[#1e293b] bg-[#111827] p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'border border-[#1e293b] bg-[#0a0f1a] text-slate-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-slate-500">Reviewing portfolio context...</div>}
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your portfolio..."
            className="min-w-0 flex-1 rounded-lg border border-[#1e293b] bg-[#111827] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
