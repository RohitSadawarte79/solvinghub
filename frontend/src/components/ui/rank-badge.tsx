'use client'

import { cn } from '@/lib/utils'
import { RANK_LABELS } from '@/lib/constants'
import type { Rank } from '@/types'

interface RankBadgeProps {
  rank: Rank
  showLabel?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const RANK_COLORS: Record<Rank, string> = {
  'S': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  'A': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700',
  'B': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700',
  'C': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  'D': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700',
  'E': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  'F': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600',
}

const SIZE_CLASSES = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
}

export function RankBadge({ rank, showLabel = false, className, size = 'md' }: RankBadgeProps) {
  const colorClass = RANK_COLORS[rank] || RANK_COLORS['F']
  const label = RANK_LABELS[rank] || 'Unknown'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold border',
        colorClass,
        SIZE_CLASSES[size],
        className
      )}
      title={showLabel ? label : undefined}
    >
      {rank}
      {showLabel && (
        <span className="ml-1 hidden sm:inline">{label}</span>
      )}
    </span>
  )
}

// Variant with points displayed
interface RankBadgeWithPointsProps {
  rank: Rank
  points: number
  className?: string
}

export function RankBadgeWithPoints({ rank, points, className }: RankBadgeWithPointsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <RankBadge rank={rank} size="sm" />
      {points > 0 && (
        <span className="text-xs text-muted-foreground">
          {points.toLocaleString()} pts
        </span>
      )}
    </div>
  )
}