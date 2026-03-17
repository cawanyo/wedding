'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  showPercent?: boolean
  color?: 'purple' | 'rose' | 'indigo' | 'green'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const colorMap = {
  purple: 'from-purple-500 to-purple-600',
  rose: 'from-rose-400 to-pink-500',
  indigo: 'from-indigo-500 to-purple-500',
  green: 'from-green-400 to-emerald-500',
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  label,
  showPercent = true,
  color = 'purple',
  size = 'md',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showPercent && (
            <span className="text-sm font-semibold text-gray-800">{clamped}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-gray-100 overflow-hidden', sizeMap[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r', colorMap[color])}
        />
      </div>
    </div>
  )
}
