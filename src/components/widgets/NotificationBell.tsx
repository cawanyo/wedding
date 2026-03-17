'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { getNotifications, markAllRead, markRead, deleteNotification } from '@/actions/notifications'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Notif = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: Date
}

const typeIcons: Record<string, string> = {
  TASK_ASSIGNED: '📋',
  TASK_VALIDATED: '✅',
  TASK_COMMENT: '💬',
  COUPLE_INVITE: '💑',
  DEFAULT: '🔔',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(false)

  const unread = notifs.filter(n => !n.read).length

  const load = async () => {
    setLoading(true)
    const data = await getNotifications()
    setNotifs(data as Notif[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAll = async () => {
    await markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const handleRead = async (id: string, link: string | null) => {
    await markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (link) setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-40 w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex gap-2">
                  {unread > 0 && (
                    <button
                      onClick={handleMarkAll}
                      className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <Check size={12} />
                      Tout lire
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading && notifs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
                ) : notifs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Aucune notification</p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'group flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                        !n.read && 'bg-purple-50/50'
                      )}
                    >
                      <div className="text-xl flex-shrink-0 mt-0.5">
                        {typeIcons[n.type] ?? typeIcons.DEFAULT}
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => handleRead(n.id, n.link)}
                            className="block"
                          >
                            <p className={cn('text-sm font-medium', !n.read ? 'text-gray-900' : 'text-gray-600')}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </Link>
                        ) : (
                          <div onClick={() => handleRead(n.id, null)} className="cursor-default">
                            <p className={cn('text-sm font-medium', !n.read ? 'text-gray-900' : 'text-gray-600')}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-300 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
