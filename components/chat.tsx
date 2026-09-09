'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, SendHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage, type ChatMessageData } from '@/components/chat-message'

function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isThinking])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isThinking) return

    const userMessage: ChatMessageData = {
      id: createId(),
      role: 'user',
      content: text,
    }

    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setIsThinking(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener una respuesta')
      }

      setMessages((prev) => [
        ...prev,
        { id: createId(), role: 'assistant', content: data.message.content },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content: 'No pude responder en este momento. Inténtalo de nuevo.',
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isComposing = e.nativeEvent.isComposing || e.keyCode === 229
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearConversation() {
    setMessages([])
    setIsThinking(false)
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              Assistant Chat
            </h1>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearConversation}
          disabled={messages.length === 0 && !isThinking}
          className="gap-1.5 text-muted-foreground"
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Clear conversation</span>
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {messages.length === 0 && !isThinking ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground">
              <Bot className="size-6" />
            </div>
            <h2 className="mt-4 text-base font-medium">
              How can I help you today?
            </h2>
            <p className="mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
              Send a message to start the conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isThinking && (
              <ChatMessage
                message={{ id: 'thinking', role: 'assistant', content: '' }}
                thinking
              />
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-6">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:ring-2 focus-within:ring-ring/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            aria-label="Message"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
            className="size-9 shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <SendHorizontal className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-center text-xs text-muted-foreground">
          Press Enter to send, Shift + Enter for a new line
        </p>
      </div>
    </div>
  )
}
