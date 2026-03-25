'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Camera, Save, Check, MapPin, Calendar, User, Mail, Shield, Star, Edit3 } from 'lucide-react'
import { profileSchema, ProfileInput } from '@/lib/validations'
import { updateProfile } from '@/actions/auth/profile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'

type User = {
  id: string
  name: string | null
  email: string
  avatar: string | null
  gender: string | null
  birthday: Date | null
  location: string | null
  createdAt: Date
}

const GENDER_OPTIONS = [
  { value: '', label: 'Non précisé' },
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'autre', label: 'Autre' },
]

export function ProfilePageClient({ user }: { user: User }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? '',
      gender: user.gender ?? '',
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      location: user.location ?? '',
    },
  })

  const onSubmit = async (data: ProfileInput) => {
    await updateProfile(data)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  const age = user.birthday
    ? Math.floor((Date.now() - new Date(user.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 text-9xl flex items-end justify-end pr-4 pb-2 pointer-events-none leading-none">👤</div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <Avatar src={user.avatar} name={user.name} size="xl" className="ring-4 ring-white/30" />
              <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-2xl truncate">{user.name || 'Utilisateur'}</h1>
              <p className="text-white/80 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail size={12} /> {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {user.location && (
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <MapPin size={10} /> {user.location}
                  </span>
                )}
                {age && (
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <Calendar size={10} /> {age} ans
                  </span>
                )}
                {user.gender && (
                  <span className="text-white/70 text-xs flex items-center gap-1">
                    <User size={10} /> {user.gender}
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                <Star size={10} /> Membre depuis {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield size={16} className="text-purple-500" />
              Informations personnelles
            </h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium">
                <Edit3 size={14} /> Modifier
              </button>
            )}
          </div>

          {!editing ? (
            <div className="p-5 space-y-4">
              {[
                { icon: User, label: 'Nom complet', value: user.name || '—' },
                { icon: Mail, label: 'Email', value: user.email },
                { icon: User, label: 'Genre', value: user.gender || '—' },
                { icon: Calendar, label: 'Date de naissance', value: user.birthday ? new Date(user.birthday).toLocaleDateString('fr-FR') : '—' },
                { icon: MapPin, label: 'Ville', value: user.location || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm text-gray-800 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <Input label="Nom complet" {...register('name')} error={errors.name?.message} />

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Genre</label>
                <div className="grid grid-cols-4 gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <label key={opt.value} className="cursor-pointer">
                      <input type="radio" value={opt.value} {...register('gender')} className="sr-only" />
                      <div className="text-center py-2 px-1 rounded-xl border-2 border-gray-100 text-xs font-medium text-gray-600 hover:border-purple-200 hover:bg-purple-50 transition-all has-[:checked]:border-purple-400 has-[:checked]:bg-purple-50 has-[:checked]:text-purple-700">
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Input label="Date de naissance" type="date" {...register('birthday')} />
              <Input label="Ville" placeholder="Paris, France" {...register('location')} />

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={isSubmitting} className="flex-1 gap-2">
                  {saved ? <><Check size={14} /> Enregistré !</> : <><Save size={14} /> Sauvegarder</>}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Account info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">Compte</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={14} className="text-emerald-500" />
              <span>Compte vérifié</span>
            </div>
            <span className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
