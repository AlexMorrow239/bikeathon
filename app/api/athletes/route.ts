import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminPassword, isValidSlug, isPositiveNumber } from '@/app/api/utils/auth'
import { Decimal } from '@prisma/client/runtime/library'

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

export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const authResult = verifyAdminPassword(request)
    if (authResult !== true) {
      return authResult
    }

    // Parse request body
    const body = await request.json()
    const { name, slug, bio, photoUrl, goal, milesGoal, teamId } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Athlete name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (teamId === undefined || teamId === null) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Process and validate slug
    const trimmedSlug = slug.trim().toLowerCase()

    if (!isValidSlug(trimmedSlug)) {
      return NextResponse.json(
        { error: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)' },
        { status: 400 }
      )
    }

    // Check for slug uniqueness
    const existingAthlete = await prisma.athlete.findUnique({
      where: { slug: trimmedSlug }
    })

    if (existingAthlete) {
      return NextResponse.json(
        { error: 'An athlete with this slug already exists' },
        { status: 409 }
      )
    }

    // Validate teamId and check if team exists
    const teamIdNum = parseInt(teamId)
    if (isNaN(teamIdNum)) {
      return NextResponse.json(
        { error: 'Team ID must be a valid number' },
        { status: 400 }
      )
    }

    const team = await prisma.team.findUnique({
      where: { id: teamIdNum }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Prepare data for creation
    const createData: any = {
      name: name.trim(),
      slug: trimmedSlug,
      team: {
        connect: { id: teamIdNum }
      }
    }

    // Validate and add optional bio
    if (bio !== undefined) {
      if (bio !== null && typeof bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string or null' },
          { status: 400 }
        )
      }
      createData.bio = bio
    }

    // Validate and add optional photoUrl
    if (photoUrl !== undefined) {
      if (photoUrl !== null && typeof photoUrl !== 'string') {
        return NextResponse.json(
          { error: 'Photo URL must be a string or null' },
          { status: 400 }
        )
      }
      createData.photoUrl = photoUrl
    }

    // Validate and add optional goal (default is 200 in database)
    if (goal !== undefined) {
      if (!isPositiveNumber(goal)) {
        return NextResponse.json(
          { error: 'Goal must be a positive number' },
          { status: 400 }
        )
      }
      // Check for reasonable maximum
      const goalNum = Number(goal)
      if (goalNum > 1000000) {
        return NextResponse.json(
          { error: 'Goal must be less than $1,000,000' },
          { status: 400 }
        )
      }
      createData.goal = new Decimal(goal)
    }
    // If goal is undefined, Prisma will use the default value from schema

    // Validate and add optional milesGoal (default is 100 in database)
    if (milesGoal !== undefined) {
      const milesGoalNum = parseInt(milesGoal)
      if (isNaN(milesGoalNum) || milesGoalNum <= 0) {
        return NextResponse.json(
          { error: 'Miles goal must be a positive integer' },
          { status: 400 }
        )
      }
      // Check for reasonable maximum
      if (milesGoalNum > 10000) {
        return NextResponse.json(
          { error: 'Miles goal must be less than 10,000' },
          { status: 400 }
        )
      }
      createData.milesGoal = milesGoalNum
    }
    // If milesGoal is undefined, Prisma will use the default value from schema

    // Create the athlete
    const newAthlete = await prisma.athlete.create({
      data: createData,
      include: {
        team: true,
        _count: {
          select: { donations: true }
        }
      }
    })

    // Return the created athlete
    return NextResponse.json({
      success: true,
      athlete: {
        ...newAthlete,
        totalRaised: newAthlete.totalRaised.toString(),
        goal: newAthlete.goal.toString(),
        donationCount: newAthlete._count.donations
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating athlete:', error)
    return NextResponse.json(
      { error: 'Failed to create athlete' },
      { status: 500 }
    )
  }
}