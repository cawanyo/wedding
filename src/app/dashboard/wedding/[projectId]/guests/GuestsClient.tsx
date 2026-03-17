'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Check, X, Users, Search, Table } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/widgets/StatCard'
import { StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import { addGuest, updateGuest } from '@/actions/finance'

type Guest = {
  id: string; name: string; phone: string | null
  email: string | null; confirmed: boolean; table: string | null
}

export function GuestsClient({ projectId, guests }: { projectId: string; guests: Guest[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', table: '' })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all')

  const confirmed = guests.filter(g => g.confirmed)
  const pending = guests.filter(g => !g.confirmed)

  const filtered = guests.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.table ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'confirmed' ? g.confirmed : !g.confirmed)
    return matchSearch && matchFilter
  })

  const handleAdd = async () => {
    if (!form.name) return
    setLoading(true)
    await addGuest(projectId, {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      table: form.table || undefined,
    })
    setForm({ name: '', phone: '', email: '', table: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const toggleConfirm = async (id: string, current: boolean) => {
    await updateGuest(id, { confirmed: !current })
    router.refresh()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Liste d'invités</h2>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus size={14} />
          Ajouter
        </Button>
      </div>

      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StaggerItem>
          <StatCard label="Total invités" value={guests.length} icon={<Users size={18} />} gradient />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Confirmés" value={confirmed.length} icon={<Check size={18} />}
            trend={{ value: `${guests.length > 0 ? Math.round(confirmed.length / guests.length * 100) : 0}%`, up: true }} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="En attente" value={pending.length} icon={<X size={18} />} />
        </StaggerItem>
      </StaggerChildren>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-40">
          <Input
            placeholder="Rechercher un invité..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          {(['all', 'confirmed', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'Tous' : f === 'confirmed' ? 'Confirmés' : 'En attente'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Users size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">Aucun invité trouvé</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Contact</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Table</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <motion.tr
                    key={g.id}
                    layout
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium text-gray-800">{g.name}</td>
                    <td className="py-3 px-2 text-gray-500 hidden sm:table-cell">
                      {g.phone ?? g.email ?? '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-500 hidden md:table-cell">
                      {g.table ? (
                        <span className="flex items-center gap-1">
                          <Table size={12} />
                          {g.table}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => toggleConfirm(g.id, g.confirmed)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${g.confirmed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {g.confirmed ? <><Check size={11} /> Confirmé</> : <><X size={11} /> En attente</>}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvel invité">
        <div className="space-y-4">
          <Input label="Nom complet" placeholder="Prénom Nom" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input label="Téléphone" placeholder="+33 6 00 00 00 00" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <Input label="Email" type="email" placeholder="invité@email.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Table" placeholder="Table 1" value={form.table}
            onChange={e => setForm(p => ({ ...p, table: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAdd} loading={loading} className="flex-1">Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
