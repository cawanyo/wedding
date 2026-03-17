import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: string; up?: boolean }
  gradient?: boolean
  className?: string
}

export function StatCard({ label, value, icon, trend, gradient, className }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-2xl p-5 border',
      gradient
        ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white border-transparent shadow-lg'
        : 'bg-white border-gray-100 shadow-sm',
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm', gradient ? 'text-purple-100' : 'text-gray-500')}>{label}</p>
          <p className={cn('text-2xl font-bold mt-1', gradient ? 'text-white' : 'text-gray-900')}>{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1', gradient ? 'text-purple-100' : trend.up ? 'text-green-600' : 'text-red-500')}>
              {trend.up ? '▲' : '▼'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-xl', gradient ? 'bg-white/20' : 'bg-purple-50 text-purple-600')}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
