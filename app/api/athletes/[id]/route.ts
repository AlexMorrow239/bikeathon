import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminPassword, isValidSlug, isPositiveNumber } from '@/app/api/utils/auth'
import { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin password
    const authResult = verifyAdminPassword(request)
    if (authResult !== true) {
      return authResult
    }

    // Parse and validate athlete ID
    const { id } = await params
    const athleteId = parseInt(id)
    if (isNaN(athleteId)) {
      return NextResponse.json(
        { error: 'Invalid athlete ID' },
        { status: 400 }
      )
    }

    // Check if athlete exists
    const existingAthlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { team: true }
    })

    if (!existingAthlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, slug, bio, photoUrl, goal, milesGoal, teamId } = body

    // Prepare update data
    const updateData: any = {}

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Athlete name must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    // Validate and add slug if provided
    if (slug !== undefined) {
      if (typeof slug !== 'string' || slug.trim().length === 0) {
        return NextResponse.json(
          { error: 'Slug must be a non-empty string' },
          { status: 400 }
        )
      }

      const trimmedSlug = slug.trim().toLowerCase()

      if (!isValidSlug(trimmedSlug)) {
        return NextResponse.json(
          { error: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)' },
          { status: 400 }
        )
      }

      // Check for slug uniqueness (if slug is being changed)
      if (trimmedSlug !== existingAthlete.slug) {
        const athleteWithSameSlug = await prisma.athlete.findUnique({
          where: { slug: trimmedSlug }
        })

        if (athleteWithSameSlug) {
          return NextResponse.json(
            { error: 'An athlete with this slug already exists' },
            { status: 409 }
          )
        }
      }

      updateData.slug = trimmedSlug
    }

    // Validate and add bio if provided
    if (bio !== undefined) {
      if (bio !== null && typeof bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string or null' },
          { status: 400 }
        )
      }
      updateData.bio = bio
    }

    // Validate and add photoUrl if provided
    if (photoUrl !== undefined) {
      if (photoUrl !== null && typeof photoUrl !== 'string') {
        return NextResponse.json(
          { error: 'Photo URL must be a string or null' },
          { status: 400 }
        )
      }
      updateData.photoUrl = photoUrl
    }

    // Validate and add goal if provided
    if (goal !== undefined) {
      if (!isPositiveNumber(goal)) {
        return NextResponse.json(
          { error: 'Goal must be a positive number' },
          { status: 400 }
        )
      }
      updateData.goal = new Decimal(goal)
    }

    // Validate and add milesGoal if provided
    if (milesGoal !== undefined) {
      const milesGoalNum = parseInt(milesGoal)
      if (isNaN(milesGoalNum) || milesGoalNum <= 0) {
        return NextResponse.json(
          { error: 'Miles goal must be a positive integer' },
          { status: 400 }
        )
      }
      updateData.milesGoal = milesGoalNum
    }

    // Validate and add teamId if provided
    if (teamId !== undefined) {
      const teamIdNum = parseInt(teamId)
      if (isNaN(teamIdNum)) {
        return NextResponse.json(
          { error: 'Team ID must be a number' },
          { status: 400 }
        )
      }

      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id: teamIdNum }
      })

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        )
      }

      updateData.team = {
        connect: { id: teamIdNum }
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // If team is being changed, use transaction to update both old and new team totals
    if (teamId !== undefined && teamId !== existingAthlete.teamId) {
      const result = await prisma.$transaction(async (tx) => {
        // Update the athlete
        const updatedAthlete = await tx.athlete.update({
          where: { id: athleteId },
          data: updateData,
          include: {
            team: true,
            _count: {
              select: { donations: true }
            }
          }
        })

        // Recalculate old team's totalRaised
        const oldTeamAggregation = await tx.athlete.aggregate({
          where: { teamId: existingAthlete.teamId },
          _sum: { totalRaised: true }
        })

        await tx.team.update({
          where: { id: existingAthlete.teamId },
          data: {
            totalRaised: oldTeamAggregation._sum.totalRaised || new Decimal(0)
          }
        })

        // Recalculate new team's totalRaised
        const newTeamAggregation = await tx.athlete.aggregate({
          where: { teamId: teamId },
          _sum: { totalRaised: true }
        })

        await tx.team.update({
          where: { id: teamId },
          data: {
            totalRaised: newTeamAggregation._sum.totalRaised || new Decimal(0)
          }
        })

        return updatedAthlete
      })

      // Return the updated athlete
      return NextResponse.json({
        success: true,
        athlete: {
          ...result,
          totalRaised: result.totalRaised.toString(),
          goal: result.goal.toString(),
          donationCount: result._count.donations
        }
      })
    } else {
      // Simple update without team change
      const updatedAthlete = await prisma.athlete.update({
        where: { id: athleteId },
        data: updateData,
        include: {
          team: true,
          _count: {
            select: { donations: true }
          }
        }
      })

      // Return the updated athlete
      return NextResponse.json({
        success: true,
        athlete: {
          ...updatedAthlete,
          totalRaised: updatedAthlete.totalRaised.toString(),
          goal: updatedAthlete.goal.toString(),
          donationCount: updatedAthlete._count.donations
        }
      })
    }

  } catch (error) {
    console.error('Error updating athlete:', error)
    return NextResponse.json(
      { error: 'Failed to update athlete' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate athlete ID
    const { id } = await params
    const athleteId = parseInt(id)
    if (isNaN(athleteId)) {
      return NextResponse.json(
        { error: 'Invalid athlete ID' },
        { status: 400 }
      )
    }

    // Fetch athlete with team and donation count
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: { donations: true }
        }
      }
    })

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    // Return the athlete data
    return NextResponse.json({
      ...athlete,
      totalRaised: athlete.totalRaised.toString(),
      goal: athlete.goal.toString(),
      donationCount: athlete._count.donations
    })

  } catch (error) {
    console.error('Error fetching athlete:', error)
    return NextResponse.json(
      { error: 'Failed to fetch athlete' },
      { status: 500 }
    )
  }
}