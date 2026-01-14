'use client'

import Link from 'next/link'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ConfigLinkCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function ConfigLinkCard({
  href,
  icon: Icon,
  title,
  description,
  className
}: ConfigLinkCardProps) {
  return (
    <Link href={href}>
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-brandy-rose-200 p-6",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brandy-rose-50 flex items-center justify-center text-brandy-rose-500 transition-colors duration-300 group-hover:bg-brandy-rose-100">
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-brandy-rose-600 transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {description}
            </p>
          </div>

          <div className="flex-shrink-0 self-center text-gray-300 group-hover:text-brandy-rose-400 transform group-hover:translate-x-1 transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
