import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { totalRaised: 'desc' },
      include: {
        _count: {
          select: { athletes: true }
        },
        athletes: {
          select: {
            id: true,
            name: true,
            totalRaised: true
          }
        }
      }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}