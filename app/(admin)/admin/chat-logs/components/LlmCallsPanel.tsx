'use client'

import { Cpu, Clock, Zap } from 'lucide-react'
import { LLMCallRecord } from '@/lib/services/chat-logger'

interface Props {
  calls: LLMCallRecord[]
}

export function LlmCallsPanel({ calls }: Props) {
  if (!calls || calls.length === 0) {
    return null
  }

  const totalDuration = calls.reduce((sum, c) => sum + c.duration_ms, 0)
  const totalTokens = calls.reduce((sum, c) => sum + (c.tokens_used || 0), 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Cpu className="w-4 h-4" />
        LLM Calls ({calls.length})
        <span className="text-muted-foreground">
          {totalDuration}ms total
          {totalTokens > 0 && ` • ${totalTokens} tokens`}
        </span>
      </div>
      <div className="space-y-1">
        {calls.map((call, i) => (
          <div key={i} className="text-xs p-2 bg-muted/30 rounded flex items-center gap-3">
            <span className="font-mono bg-muted px-1 rounded">{call.type}</span>
            <span className="text-muted-foreground truncate flex-1">
              {call.prompt_preview}...
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {call.duration_ms}ms
            </span>
            {call.tokens_used && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {call.tokens_used}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
