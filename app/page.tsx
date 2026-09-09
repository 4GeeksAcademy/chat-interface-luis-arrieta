'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { Chat } from '@/components/chat'
import { ConversationHistory } from '@/components/conversation-history'
import { TokenStats } from '@/components/token-stats'
import { Button } from '@/components/ui/button'
import {
  createEmptyConversation,
  defaultConversation,
  STORAGE_KEYS,
  usageForConversation,
  type Conversation,
  type Message,
  type ResponseMeta,
} from '@/lib/chat-data'

interface ChatApiResponse {
  message: { role: 'assistant'; content: string }
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false

  const message = value as Record<string, unknown>
  return (
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    typeof message.createdAt === 'number' &&
    typeof message.promptTokens === 'number' &&
    typeof message.completionTokens === 'number'
  )
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false

  const conversation = value as Record<string, unknown>
  return (
    typeof conversation.id === 'string' &&
    typeof conversation.title === 'string' &&
    typeof conversation.model === 'string' &&
    typeof conversation.updatedAt === 'number' &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isMessage) &&
    (conversation.lastApiPromptTokens === undefined ||
      typeof conversation.lastApiPromptTokens === 'number')
  )
}

function isChatApiResponse(value: unknown): value is ChatApiResponse {
  if (!value || typeof value !== 'object') return false

  const response = value as Record<string, unknown>
  const message = response.message
  const usage = response.usage

  return (
    !!message &&
    typeof message === 'object' &&
    (message as Record<string, unknown>).role === 'assistant' &&
    typeof (message as Record<string, unknown>).content === 'string' &&
    !!usage &&
    typeof usage === 'object' &&
    typeof (usage as Record<string, unknown>).prompt_tokens === 'number' &&
    typeof (usage as Record<string, unknown>).completion_tokens === 'number' &&
    typeof (usage as Record<string, unknown>).total_tokens === 'number' &&
    typeof response.model === 'string'
  )
}

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>([
    defaultConversation,
  ])
  const [activeId, setActiveId] = useState(defaultConversation.id)
  const [query, setQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [lastTurnTokens, setLastTurnTokens] = useState(0)
  const [lastResponseMeta, setLastResponseMeta] =
    useState<ResponseMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const savedConversations = window.localStorage.getItem(
        STORAGE_KEYS.conversations,
      )
      const savedActiveId = window.localStorage.getItem(STORAGE_KEYS.activeId)

      if (savedConversations) {
        const parsedConversations: unknown = JSON.parse(savedConversations)

        if (
          Array.isArray(parsedConversations) &&
          parsedConversations.length > 0 &&
          parsedConversations.every(isConversation)
        ) {
          setConversations(parsedConversations)
          setActiveId(
            savedActiveId &&
              parsedConversations.some(
                (conversation) => conversation.id === savedActiveId,
              )
              ? savedActiveId
              : parsedConversations[0].id,
          )
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEYS.conversations)
      window.localStorage.removeItem(STORAGE_KEYS.activeId)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    window.localStorage.setItem(
      STORAGE_KEYS.conversations,
      JSON.stringify(conversations),
    )
    window.localStorage.setItem(STORAGE_KEYS.activeId, activeId)
  }, [activeId, conversations, hydrated])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [activeId, conversations],
  )
  const usage = useMemo(
    () => usageForConversation(activeConversation),
    [activeConversation],
  )

  function handleNewChat() {
    const conversation = createEmptyConversation(
      activeConversation?.model ?? defaultConversation.model,
    )

    setConversations((current) => [conversation, ...current])
    setActiveId(conversation.id)
    setLastTurnTokens(0)
    setLastResponseMeta(null)
    setError(null)
  }

  function handleClear() {
    if (!activeConversation) return

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: [],
              lastApiPromptTokens: undefined,
              updatedAt: Date.now(),
            }
          : conversation,
      ),
    )
    setLastTurnTokens(0)
    setLastResponseMeta(null)
    setError(null)
  }

  async function handleSend(text: string) {
    if (!activeConversation || !text.trim() || isThinking) return

    const startedAt = performance.now()
    const userMessage: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: Date.now(),
      promptTokens: 0,
      completionTokens: 0,
    }
    const messagesForRequest = [...activeConversation.messages, userMessage]

    setIsThinking(true)
    setError(null)
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              messages: messagesForRequest,
              updatedAt: Date.now(),
            }
          : conversation,
      ),
    )

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForRequest.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      })
      const result: unknown = await response.json()

      if (!response.ok || !isChatApiResponse(result)) {
        throw new Error('No se pudo obtener una respuesta de la IA')
      }

      const incrementalPrompt = Math.max(
        0,
        result.usage.prompt_tokens -
          (activeConversation.lastApiPromptTokens ?? 0),
      )
      const assistantMessage: Message = {
        id: `m-${Date.now()}-assistant`,
        role: 'assistant',
        content: result.message.content,
        createdAt: Date.now(),
        promptTokens: 0,
        completionTokens: result.usage.completion_tokens,
      }
      const responseTimeMs = Math.round(performance.now() - startedAt)

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === userMessage.id
                    ? { ...message, promptTokens: incrementalPrompt }
                    : message,
                ).concat(assistantMessage),
                lastApiPromptTokens: result.usage.prompt_tokens,
                model: result.model,
                updatedAt: Date.now(),
              }
            : conversation,
        ),
      )
      setLastTurnTokens(incrementalPrompt + result.usage.completion_tokens)
      setLastResponseMeta({
        model: result.model,
        responseTimeMs,
        tokensPerSecond:
          responseTimeMs === 0
            ? 0
            : (result.usage.completion_tokens / responseTimeMs) * 1000,
      })
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No se pudo obtener una respuesta de la IA',
      )
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ConversationHistory
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNewChat={handleNewChat}
        query={query}
        onQueryChange={setQuery}
      />

      <main className="relative min-w-0 flex-1">
        {error && (
          <div className="absolute inset-x-4 top-3 z-10 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{error}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
        {/* Chat will accept messages, isThinking, onSend, and onClear props in a later refactor. */}
        <Chat />
      </main>

      <TokenStats
        usage={usage}
        conversation={activeConversation}
        lastTurnTokens={lastTurnTokens}
        lastResponseMeta={lastResponseMeta}
      />
    </div>
  )
}
