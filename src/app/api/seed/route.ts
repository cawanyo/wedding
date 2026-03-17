import { NextResponse } from 'next/server'
import { seedQuestions } from '@/actions/couple'

export async function POST() {
  const result = await seedQuestions()
  return NextResponse.json(result)
}
