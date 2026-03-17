'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Heart, Gem, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/wedding', label: 'Mariage', icon: Gem },
  { href: '/dashboard/couple', label: 'Couple', icon: Heart },
  { href: '/dashboard/profile', label: 'Profil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-bottom">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={cn(
                'flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                active ? 'text-purple-600' : 'text-gray-400'
              )}>
                <Icon size={20} />
                <span>{label}</span>
                {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-purple-600 rounded-full" />}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
