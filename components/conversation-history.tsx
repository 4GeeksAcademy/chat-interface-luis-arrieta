'use client'

import { MessageSquarePlus, Search } from 'lucide-react'

import type { Conversation } from '@/lib/chat-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ConversationHistoryProps {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onNewChat: () => void
  query: string
  onQueryChange: (value: string) => void
}

function timeAgo(timestamp: number): string {
  const elapsedMs = Math.max(0, Date.now() - timestamp)
  const elapsedMinutes = Math.floor(elapsedMs / 60_000)

  if (elapsedMinutes < 1) return 'just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`

  return `${Math.floor(elapsedHours / 24)}d ago`
}

function previewForConversation(conversation: Conversation): string {
  const lastMessage = conversation.messages.at(-1)?.content

  return lastMessage?.replace(/\s+/g, ' ').trim() || 'No messages yet'
}

export function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  query,
  onQueryChange,
}: ConversationHistoryProps) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLocaleLowerCase().includes(normalizedQuery),
  )

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-border p-4">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <span className="text-xs text-muted-foreground">
            {conversations.length}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onNewChat}
          className="w-full justify-start gap-2"
        >
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          New chat
        </Button>
      </div>

      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 focus-within:ring-2 focus-within:ring-ring/50">
          <Search
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredConversations.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No conversations found
          </p>
        ) : (
          <ul className="space-y-1" aria-label="Conversation history">
            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeId

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`Open conversation: ${conversation.title}`}
                    className={cn(
                      'w-full rounded-lg border border-transparent px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'border-border bg-sidebar-accent'
                        : 'hover:bg-sidebar-accent/60',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">
                        {conversation.title}
                      </p>
                      <time
                        dateTime={new Date(conversation.updatedAt).toISOString()}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {timeAgo(conversation.updatedAt)}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {previewForConversation(conversation)}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
