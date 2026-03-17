'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Phone, Trash2, Store, Euro } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import { addVendor } from '@/actions/finance'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

type Vendor = {
  id: string; name: string; category: string
  contact: string | null; price: number | null; notes: string | null
}

const CATEGORIES = ['Traiteur', 'Salle', 'Photographe', 'Vidéaste', 'DJ / Orchestre', 'Fleuriste', 'Transport', 'Tenue', 'Coiffure / Maquillage', 'Autre']

const categoryColors: Record<string, 'purple' | 'info' | 'success' | 'warning' | 'default'> = {
  Traiteur: 'success', Salle: 'purple', Photographe: 'info',
  Vidéaste: 'info', Fleuriste: 'success', DJ: 'warning',
}

export function VendorsClient({ projectId, vendors }: { projectId: string; vendors: Vendor[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Traiteur', contact: '', price: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  )

  const totalEstimated = vendors.reduce((s, v) => s + (v.price ?? 0), 0)

  const handleAdd = async () => {
    if (!form.name || !form.category) return
    setLoading(true)
    await addVendor(projectId, {
      name: form.name,
      category: form.category,
      contact: form.contact || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      notes: form.notes || undefined,
    })
    setForm({ name: '', category: 'Traiteur', contact: '', price: '', notes: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fournisseurs</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {vendors.length} fournisseur{vendors.length > 1 ? 's' : ''} • Estimé total: {formatCurrency(totalEstimated)}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus size={14} />
          Ajouter
        </Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Rechercher un fournisseur..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Store size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Aucun fournisseur</p>
          <Button onClick={() => setOpen(true)} className="mt-4" variant="secondary">
            <Plus size={14} />
            Ajouter un fournisseur
          </Button>
        </Card>
      ) : (
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(v => (
            <StaggerItem key={v.id}>
              <Card hover>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{v.name}</h3>
                    <Badge label={v.category} variant={categoryColors[v.category] ?? 'default'} className="mt-1" />
                  </div>
                  {v.price && (
                    <span className="text-sm font-bold text-purple-600">{formatCurrency(v.price)}</span>
                  )}
                </div>
                {v.contact && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                    <Phone size={11} />
                    {v.contact}
                  </p>
                )}
                {v.notes && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{v.notes}</p>
                )}
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau fournisseur">
        <div className="space-y-4">
          <Input label="Nom" placeholder="Ex: Traiteur Dupont" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Catégorie</label>
            <select className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Contact" placeholder="Téléphone ou email" value={form.contact}
            onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} />
          <Input label="Prix estimé (€)" type="number" placeholder="0" value={form.price}
            onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2}
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAdd} loading={loading} className="flex-1">Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
