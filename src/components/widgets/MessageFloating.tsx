'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Heart, Loader2 } from 'lucide-react'
import { sendMessage, getMessages, markMessagesRead } from '@/actions/couple'
import { Avatar } from '@/components/ui/Avatar'
import Pusher from 'pusher-js'

type Message = {
  id: string
  content: string
  senderId: string
  createdAt: Date | string
  sender: { id: string; name: string | null; avatar: string | null }
}

export function MessageFloating({
  coupleId,
  currentUserId,
  partnerName,
  partnerImage,
  initialUnread,
}: {
  coupleId: string
  currentUserId: string
  partnerName: string | null
  partnerImage: string | null
  initialUnread: number
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(initialUnread)
  const [sending, startSend] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!coupleId) return
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
    const channel = pusher.subscribe(`couple-${coupleId}`)
    channel.bind('new-message', (data: Message) => {
      setMessages(prev => [...prev, data])
      if (!open) setUnread(u => u + 1)
    })
    return () => { channel.unbind_all(); pusher.disconnect() }
  }, [coupleId, open])

  useEffect(() => {
    if (open) {
      getMessages(coupleId).then(msgs => setMessages(msgs as Message[]))
      markMessagesRead(coupleId)
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, coupleId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    startSend(async () => {
      const res = await sendMessage(coupleId, content)
      if (res.success && res.message) {
        setMessages(prev => [...prev, res.message as Message])
      }
    })
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-200 flex items-center justify-center text-white"
            >
              <MessageCircle size={24} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Message panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-80 h-[480px] bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex-shrink-0">
              <Avatar src={partnerImage} name={partnerName} size="sm" className="border-2 border-white/30" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{partnerName || 'Ton partenaire'}</p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <Heart size={9} /> Espace couple privé
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Heart size={32} className="text-pink-200 mb-2" />
                  <p className="text-gray-400 text-sm">Commencez à vous écrire</p>
                  <p className="text-gray-300 text-xs mt-1">Vos messages sont privés</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Écris un message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
