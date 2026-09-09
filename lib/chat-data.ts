export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  promptTokens: number
  completionTokens: number
}

export interface Conversation {
  id: string
  title: string
  model: string
  updatedAt: number
  messages: Message[]
  // Tokens acumulados de la última llamada a la API para contabilizar por turno.
  lastApiPromptTokens?: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ResponseMeta {
  model: string
  responseTimeMs: number
  tokensPerSecond: number
}

export const CONTEXT_WINDOW = 128000

export const PRICE_PER_1K = {
  prompt: 0.005,
  completion: 0.015,
} as const

export const STORAGE_KEYS = {
  conversations: 'chat-conversations',
  activeId: 'chat-active-id',
} as const

/** Suma los tokens registrados en cada mensaje de una conversación. */
export function usageForConversation(
  conversation: Conversation | undefined,
): TokenUsage {
  const usage = conversation?.messages.reduce(
    (total, message) => ({
      promptTokens: total.promptTokens + message.promptTokens,
      completionTokens: total.completionTokens + message.completionTokens,
    }),
    { promptTokens: 0, completionTokens: 0 },
  ) ?? { promptTokens: 0, completionTokens: 0 }

  return {
    ...usage,
    totalTokens: usage.promptTokens + usage.completionTokens,
  }
}

/** Calcula el coste estimado aplicando las tarifas por cada mil tokens. */
export function estimateCost(usage: TokenUsage): number {
  return (
    (usage.promptTokens / 1000) * PRICE_PER_1K.prompt +
    (usage.completionTokens / 1000) * PRICE_PER_1K.completion
  )
}

export function createEmptyConversation(model: string): Conversation {
  const createdAt = Date.now()

  return {
    id: `c-${createdAt}`,
    title: 'New chat',
    model,
    updatedAt: createdAt,
    messages: [],
  }
}

export const defaultConversation = createEmptyConversation(
  'llama-3.3-70b-versatile',
)
