import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const weddingProjectSchema = z.object({
  title: z.string().min(2, 'Titre requis'),
  description: z.string().optional(),
  weddingDate: z.string().optional(),
})

export const weddingStepSchema = z.object({
  title: z.string().min(2, 'Titre requis'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  budgetLimit: z.coerce.number().optional(),
  order: z.coerce.number().optional(),
})

export const taskSchema = z.object({
  title: z.string().min(2, 'Titre requis'),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  budgetLimit: z.coerce.number().optional(),
  realCost: z.coerce.number().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'VALIDATED']).optional(),
})

export const financeRecordSchema = z.object({
  label: z.string().min(1, 'Libellé requis'),
  amount: z.coerce.number().min(0),
  type: z.enum(['BUDGET', 'EXPENSE']),
  stepId: z.string().optional(),
  taskId: z.string().optional(),
})

export const vendorSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contact: z.string().optional(),
  price: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export const guestSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  confirmed: z.boolean().optional(),
  table: z.string().optional(),
})

export const answerSchema = z.object({
  questionId: z.string(),
  content: z.string().min(1, 'Réponse requise'),
})

export const profileSchema = z.object({
  name: z.string().min(2),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  location: z.string().optional(),
})

export const weeklyCheckinSchema = z.object({
  score: z.coerce.number().min(1).max(10),
  feeling: z.string().optional(),
  improvement: z.string().optional(),
  gratitude: z.string().optional(),
})

export const coupleGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().optional(),
})

export const dailyReflectionSchema = z.object({
  mood: z.coerce.number().min(1).max(5),
  gratitude: z.string().optional(),
  note: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type WeddingProjectInput = z.infer<typeof weddingProjectSchema>
export type WeddingStepInput = z.infer<typeof weddingStepSchema>
export type TaskInput = z.infer<typeof taskSchema>
export type FinanceRecordInput = z.infer<typeof financeRecordSchema>
export type VendorInput = z.infer<typeof vendorSchema>
export type GuestInput = z.infer<typeof guestSchema>
export type AnswerInput = z.infer<typeof answerSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type WeeklyCheckinInput = z.infer<typeof weeklyCheckinSchema>
export type CoupleGoalInput = z.infer<typeof coupleGoalSchema>
export type DailyReflectionInput = z.infer<typeof dailyReflectionSchema>
