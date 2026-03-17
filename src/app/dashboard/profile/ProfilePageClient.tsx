'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Save } from 'lucide-react'
import { profileSchema, ProfileInput } from '@/lib/validations'
import { updateProfile } from '@/actions/auth/profile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { FadeIn } from '@/components/animations/transitions'
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

export function ProfilePageClient({ user }: { user: User }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
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
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <FadeIn>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={user.avatar} name={user.name} size="xl" />
              <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md hover:bg-purple-700">
                <Camera size={13} />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">Membre depuis {formatDate(user.createdAt)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Informations personnelles</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nom complet"
              {...register('name')}
              error={errors.name?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Genre</label>
                <select
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  {...register('gender')}
                >
                  <option value="">Non précisé</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <Input
                label="Date de naissance"
                type="date"
                {...register('birthday')}
              />
            </div>
            <Input
              label="Ville"
              placeholder="Paris, France"
              {...register('location')}
            />
            <Button type="submit" loading={isSubmitting} className="flex gap-2">
              <Save size={16} />
              {saved ? 'Enregistré !' : 'Enregistrer'}
            </Button>
          </form>
        </Card>
      </FadeIn>
    </div>
  )
}
