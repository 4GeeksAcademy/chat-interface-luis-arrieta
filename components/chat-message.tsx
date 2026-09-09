import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThinkingIndicator } from '@/components/thinking-indicator'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessageData {
  id: string
  role: ChatRole
  content: string
}

interface ChatMessageProps {
  message: ChatMessageData
  thinking?: boolean
}

export function ChatMessage({ message, thinking = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card text-foreground',
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm border border-border bg-card text-card-foreground',
        )}
      >
        {thinking ? (
          <ThinkingIndicator />
        ) : (
          <p className="whitespace-pre-wrap text-pretty">{message.content}</p>
        )}
      </div>
    </div>
  )
}
