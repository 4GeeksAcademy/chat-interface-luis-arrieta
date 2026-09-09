import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'value'> {
  value: number
}

function Progress({ value, className, ...props }: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      data-slot="progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  )
}

export { Progress, type ProgressProps }
