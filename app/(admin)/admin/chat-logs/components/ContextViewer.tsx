'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  data: Record<string, any>
  title?: string
}

export function ContextViewer({ data, title = 'Contexto' }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!data || Object.keys(data).length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span className="font-medium">{title}</span>
      </button>
      {expanded && (
        <pre className="p-3 pt-0 text-xs overflow-auto max-h-64 bg-muted/30">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
