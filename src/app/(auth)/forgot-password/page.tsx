'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Mail, ArrowLeft, KeyRound, ShieldCheck, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Step = 'email' | 'code' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')

  const handleRequestCode = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (data.devCode) setDevCode(data.devCode)
    setLoading(false)
    setStep('code')
  }

  const handlePasteCode = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCodeDigits(pasted.split(''))
      setCode(pasted)
      e.preventDefault()
    }
  }

  const handleDigit = (i: number, val: string) => {
    const digits = [...codeDigits]
    digits[i] = val.replace(/\D/g, '').slice(-1)
    setCodeDigits(digits)
    setCode(digits.join(''))
    if (val && i < 5) {
      document.getElementById(`code-digit-${i + 1}`)?.focus()
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[i] && i > 0) {
      document.getElementById(`code-digit-${i - 1}`)?.focus()
    }
  }

  const handleResetPassword = async () => {
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Minimum 6 caractères'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.success) {
      setError(data.error || 'Erreur')
    } else {
      setStep('done')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg mb-4">
            <Heart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
          <p className="text-gray-500 mt-1 text-sm">Réinitialisez votre mot de passe en quelques étapes</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {(['email', 'code', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-purple-600 text-white shadow-md shadow-purple-200' :
                (i < (['email', 'code', 'done'] as Step[]).indexOf(step)) ? 'bg-emerald-500 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < (['email', 'code', 'done'] as Step[]).indexOf(step) ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`h-px w-8 ${i < (['email', 'code', 'done'] as Step[]).indexOf(step) ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <AnimatePresence mode="wait">

            {/* Step 1: Email */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 bg-purple-50 rounded-2xl p-4">
                  <Mail size={20} className="text-purple-500 flex-shrink-0" />
                  <p className="text-sm text-purple-700">Entrez votre email et nous vous enverrons un code de vérification.</p>
                </div>
                <Input
                  label="Adresse email"
                  type="email"
                  placeholder="vous@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRequestCode()}
                  autoFocus
                />
                <Button onClick={handleRequestCode} disabled={!email.trim() || loading} className="w-full" size="lg">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Envoi...</> : <><Mail size={16} /> Envoyer le code</>}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Code + new password */}
            {step === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-4">
                  <KeyRound size={20} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Code envoyé à {email}</p>
                    <p className="text-xs text-amber-600 mt-0.5">Vérifiez votre boîte mail (et spam). Valable 15 min.</p>
                  </div>
                </div>

                {devCode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-500 font-medium">Mode dev — code : <span className="font-mono text-blue-700 text-base font-bold tracking-widest">{devCode}</span></p>
                  </div>
                )}

                {/* Code input */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-3">Code de vérification</label>
                  <div className="flex gap-2 justify-center" onPaste={handlePasteCode}>
                    {codeDigits.map((d, i) => (
                      <input
                        key={i}
                        id={`code-digit-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigit(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className={`h-12 w-10 rounded-xl border-2 text-center text-lg font-bold focus:outline-none transition-all ${
                          d ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-200 focus:border-purple-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* New password */}
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />

                {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

                <Button
                  onClick={handleResetPassword}
                  disabled={code.length < 6 || !password || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Vérification...</> : <><ShieldCheck size={16} /> Réinitialiser</>}
                </Button>

                <button onClick={() => { setStep('email'); setError('') }} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mx-auto">
                  <ArrowLeft size={14} /> Changer d'email
                </button>
              </motion.div>
            )}

            {/* Step 3: Done */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-4">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Mot de passe réinitialisé !</h2>
                <p className="text-gray-500 text-sm">Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.</p>
                <Button onClick={() => router.push('/login')} className="w-full" size="lg">
                  Se connecter
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link href="/login" className="text-purple-600 font-medium hover:underline flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
