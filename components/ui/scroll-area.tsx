import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'both'
}

function ScrollArea({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaProps) {
  return (
    <div
      data-slot="scroll-area"
      className={cn(
        orientation === 'vertical' ? 'overflow-y-auto' : 'overflow-auto',
        '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

export { ScrollArea, type ScrollAreaProps }
