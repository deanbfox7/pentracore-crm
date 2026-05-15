import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  role: ChatRole
  content: string
}

const CLAUDE_MODEL = 'claude-haiku-4-5'
const OPENAI_FALLBACK_MODEL = 'gpt-4o-mini'

let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  anthropicClient ||= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropicClient
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  openaiClient ||= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openaiClient
}

export function trimToLastFivePairs(messages: ChatMessage[]) {
  const clean = messages.filter((message) => message.content.trim())
  while (clean[0]?.role === 'assistant') clean.shift()

  const trailingUser = clean[clean.length - 1]?.role === 'user' ? clean[clean.length - 1] : null
  const result: ChatMessage[] = []
  let pairs = 0
  let index = trailingUser ? clean.length - 2 : clean.length - 1

  while (index > 0 && pairs < 5) {
    const assistant = clean[index]
    const user = clean[index - 1]

    if (assistant?.role === 'assistant' && user?.role === 'user') {
      result.unshift(user, assistant)
      pairs += 1
      index -= 2
    } else {
      index -= 1
    }
  }

  if (trailingUser) result.push(trailingUser)
  return result
}

export async function createCachedChatCompletion({
  system,
  messages,
  maxTokens = 400,
}: {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}) {
  const trimmedMessages = trimToLastFivePairs(messages)
  const anthropic = getAnthropic()

  if (anthropic) {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: system,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: trimmedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    return response.content[0]?.type === 'text' ? response.content[0].text : ''
  }

  const openai = getOpenAI()
  if (!openai) {
    throw new Error('ANTHROPIC_API_KEY or OPENAI_API_KEY is required')
  }

  const response = await openai.chat.completions.create({
    model: OPENAI_FALLBACK_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      ...trimmedMessages.map((m) => ({ role: m.role, content: m.content })),
    ],
  })

  return response.choices[0]?.message.content || ''
}
