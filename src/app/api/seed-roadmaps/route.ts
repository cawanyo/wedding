import { NextResponse } from 'next/server'
import { seedPredefinedRoadmaps } from '@/actions/discovery'

export async function GET() {
  const result = await seedPredefinedRoadmaps()
  return NextResponse.json(result)
}
