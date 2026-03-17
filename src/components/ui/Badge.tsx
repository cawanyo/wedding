import { cn } from '@/lib/utils'

interface BadgeProps {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className?: string
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantStyles[variant], className)}>
      {label}
    </span>
  )
}

export function taskStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    TODO: { label: 'À faire', variant: 'default' },
    IN_PROGRESS: { label: 'En cours', variant: 'info' },
    DONE: { label: 'Terminé', variant: 'success' },
    VALIDATED: { label: 'Validé', variant: 'purple' },
  }
  const s = map[status] ?? { label: status, variant: 'default' }
  return <Badge label={s.label} variant={s.variant} />
}
