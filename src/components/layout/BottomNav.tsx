'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Heart, CalendarDays, User, LogOut, Compass } from 'lucide-react' // Ajout de LogOut
import { signOut } from 'next-auth/react' // Import pour la déconnexion

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/dashboard/wedding', icon: CalendarDays, label: 'Mariage' },
    { href: '/dashboard/couple', icon: Heart, label: 'Couple' },
    { href: '/dashboard/decouverte', icon: Compass, label: 'Découverte' },
    { href: '/dashboard/profile', icon: User, label: 'Profil' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'text-purple-600 bg-purple-50' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
        
        {/* Bouton de déconnexion ajouté pour le mobile */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex flex-col items-center p-2 rounded-xl text-gray-400 hover:text-red-500"
        >
          <LogOut size={20} />
          <span className="text-[10px] mt-1 font-medium">Quitter</span>
        </button>
      </div>
    </nav>
  )
}