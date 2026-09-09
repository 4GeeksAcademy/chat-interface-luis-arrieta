'use client'

import type { ComponentType } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Coins,
  Gauge,
  Zap,
} from 'lucide-react'

import {
  CONTEXT_WINDOW,
  estimateCost,
  PRICE_PER_1K,
  type Conversation,
  type ResponseMeta,
  type TokenUsage,
} from '@/lib/chat-data'

interface TokenStatsProps {
  usage: TokenUsage
  conversation: Conversation | undefined
  lastTurnTokens: number
  lastResponseMeta: ResponseMeta | null
}

interface StatRowProps {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: string
  hint?: string
}

function StatRow({ icon: Icon, label, value, hint }: StatRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-card-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function TokenStats({
  usage,
  conversation,
  lastTurnTokens,
  lastResponseMeta,
}: TokenStatsProps) {
  const contextPercentage = Math.min(
    100,
    (usage.totalTokens / CONTEXT_WINDOW) * 100,
  )
  const promptPercentage =
    usage.totalTokens === 0 ? 0 : (usage.promptTokens / usage.totalTokens) * 100
  const completionPercentage =
    usage.totalTokens === 0 ? 0 : 100 - promptPercentage
  const estimatedCost = estimateCost(usage)

  return (
    <aside className="h-full w-80 shrink-0 overflow-y-auto border-l border-border bg-card p-4 text-card-foreground">
      <div className="mb-5 flex items-start gap-2">
        <Gauge className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Token usage</h2>
          <p className="truncate text-xs text-muted-foreground">
            {conversation?.model ?? 'No model selected'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <section className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Total tokens</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatNumber(usage.totalTokens)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last turn: +{formatNumber(lastTurnTokens)}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Context window</span>
            <span className="tabular-nums text-muted-foreground">
              {contextPercentage.toFixed(1)}%
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Context window usage"
            aria-valuemin={0}
            aria-valuemax={CONTEXT_WINDOW}
            aria-valuenow={Math.min(usage.totalTokens, CONTEXT_WINDOW)}
          >
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${contextPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatNumber(usage.totalTokens)} used / 128K max
          </p>
        </section>

        <section className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-sm font-medium">Breakdown</h3>
          <StatRow
            icon={ArrowUp}
            label="Prompt tokens"
            value={formatNumber(usage.promptTokens)}
            hint={`${promptPercentage.toFixed(1)}% of total`}
          />
          <div className="border-t border-border" />
          <StatRow
            icon={ArrowDown}
            label="Completion tokens"
            value={formatNumber(usage.completionTokens)}
            hint={`${completionPercentage.toFixed(1)}% of total`}
          />
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-chart-2"
              style={{ width: `${promptPercentage}%` }}
              aria-label="Prompt token proportion"
            />
            <div
              className="bg-primary"
              style={{ width: `${completionPercentage}%` }}
              aria-label="Completion token proportion"
            />
          </div>
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-2" aria-hidden="true" />
              Prompt
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Completion
            </span>
          </div>
        </section>

        {lastResponseMeta && (
          <section className="rounded-xl border border-border bg-background p-4">
            <h3 className="text-sm font-medium">Last response</h3>
            <StatRow
              icon={Clock}
              label="Response time"
              value={`${lastResponseMeta.responseTimeMs} ms`}
            />
            <div className="border-t border-border" />
            <StatRow
              icon={Zap}
              label="Tokens per second"
              value={lastResponseMeta.tokensPerSecond.toFixed(1)}
            />
            <div className="border-t border-border" />
            <StatRow
              icon={Gauge}
              label="Model"
              value={lastResponseMeta.model}
            />
          </section>
        )}

        <section className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Estimated cost</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            ${estimatedCost.toFixed(4)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ${PRICE_PER_1K.prompt} prompt / ${PRICE_PER_1K.completion}{' '}
            completion per 1K tokens
          </p>
        </section>
      </div>
    </aside>
  )
}
