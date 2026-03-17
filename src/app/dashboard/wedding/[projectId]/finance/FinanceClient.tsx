'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/widgets/StatCard'
import { StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import { addFinanceRecord, deleteFinanceRecord } from '@/actions/finance'
import { formatCurrency, formatDate } from '@/lib/utils'

type Step = { id: string; title: string }
type Record = {
  id: string; label: string; amount: number; type: string
  createdAt: Date; step: Step | null
}
type Finance = {
  records: Record[]
  totalBudget: number
  totalExpense: number
  diff: number
}

const COLORS = ['#9333ea', '#ec4899', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

export function FinanceClient({
  projectId, finance, steps
}: {
  projectId: string
  finance: Finance
  steps: Step[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ label: '', amount: '', type: 'EXPENSE', stepId: '' })
  const [loading, setLoading] = useState(false)

  const budgetUsed = finance.totalBudget > 0
    ? Math.round((finance.totalExpense / finance.totalBudget) * 100)
    : 0

  const stepExpenses = steps.map(s => ({
    name: s.title.length > 14 ? s.title.slice(0, 14) + '…' : s.title,
    dépense: finance.records
      .filter(r => r.type === 'EXPENSE' && r.step?.id === s.id)
      .reduce((sum, r) => sum + r.amount, 0),
  })).filter(s => s.dépense > 0)

  const pieData = stepExpenses.length > 0 ? stepExpenses.map(s => ({ name: s.name, value: s.dépense })) : []

  const handleAdd = async () => {
    if (!form.label || !form.amount) return
    setLoading(true)
    await addFinanceRecord(projectId, {
      label: form.label,
      amount: parseFloat(form.amount),
      type: form.type as 'BUDGET' | 'EXPENSE',
      stepId: form.stepId || undefined,
    })
    setForm({ label: '', amount: '', type: 'EXPENSE', stepId: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    await deleteFinanceRecord(id, projectId)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bilan financier</h2>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus size={14} />
          Ajouter
        </Button>
      </div>

      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StaggerItem>
          <StatCard label="Budget prévu" value={formatCurrency(finance.totalBudget)} icon={<Wallet size={18} />} gradient />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Dépenses réelles"
            value={formatCurrency(finance.totalExpense)}
            icon={<TrendingDown size={18} />}
            trend={{ value: `${budgetUsed}% du budget`, up: budgetUsed <= 100 }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Différence"
            value={formatCurrency(finance.diff)}
            icon={<TrendingUp size={18} />}
            trend={{ value: finance.diff >= 0 ? 'Sous budget' : 'Dépassement', up: finance.diff >= 0 }}
          />
        </StaggerItem>
      </StaggerChildren>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {stepExpenses.length > 0 && (
          <Card>
            <CardHeader title="Dépenses par étape" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stepExpenses} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="dépense" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {pieData.length > 0 && (
          <Card>
            <CardHeader title="Répartition" />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader title="Toutes les transactions" />
        {finance.records.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wallet size={32} className="mx-auto mb-2 text-gray-200" />
            Aucune transaction
          </div>
        ) : (
          <div className="space-y-2">
            {finance.records.map(r => (
              <motion.div
                key={r.id}
                layout
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 group"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${r.type === 'BUDGET' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                  {r.type === 'BUDGET' ? '+' : '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{r.label}</p>
                  <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                    {r.step && <span>{r.step.title}</span>}
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${r.type === 'BUDGET' ? 'text-green-600' : 'text-red-500'}`}>
                    {r.type === 'BUDGET' ? '+' : '-'}{formatCurrency(r.amount)}
                  </span>
                  <Badge label={r.type === 'BUDGET' ? 'Budget' : 'Dépense'} variant={r.type === 'BUDGET' ? 'success' : 'danger'} />
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle transaction">
        <div className="space-y-4">
          <div className="flex gap-3">
            {['EXPENSE', 'BUDGET'].map(t => (
              <button
                key={t}
                onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${form.type === t ? (t === 'BUDGET' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600') : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                {t === 'BUDGET' ? '+ Budget prévu' : '- Dépense réelle'}
              </button>
            ))}
          </div>
          <Input label="Libellé" placeholder="Ex: Traiteur" value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          <Input label="Montant (€)" type="number" placeholder="0" value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Étape (optionnel)</label>
            <select className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={form.stepId} onChange={e => setForm(p => ({ ...p, stepId: e.target.value }))}>
              <option value="">Aucune étape</option>
              {steps.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
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
