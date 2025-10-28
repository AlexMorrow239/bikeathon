import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const athletes = await prisma.athlete.findMany({
      include: {
        team: true,
        _count: {
          select: { donations: true }
        }
      },
      orderBy: { totalRaised: 'desc' }
    })

    return NextResponse.json(athletes)
  } catch (error) {
    console.error('Error fetching athletes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    )
  }
}