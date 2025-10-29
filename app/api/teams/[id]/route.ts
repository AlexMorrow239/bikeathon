import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdminPassword, isValidHexColor } from '@/app/api/utils/auth'

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

    // Parse and validate team ID
    const { id } = await params
    const teamId = parseInt(id)
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      )
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, color } = body

    // Prepare update data
    const updateData: any = {}

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Team name must be a non-empty string' },
          { status: 400 }
        )
      }

      // Check for name uniqueness (if name is being changed)
      if (name !== existingTeam.name) {
        const teamWithSameName = await prisma.team.findUnique({
          where: { name }
        })

        if (teamWithSameName) {
          return NextResponse.json(
            { error: 'A team with this name already exists' },
            { status: 409 }
          )
        }
      }

      updateData.name = name.trim()
    }

    // Validate and add color if provided
    if (color !== undefined) {
      if (!isValidHexColor(color)) {
        return NextResponse.json(
          { error: 'Color must be a valid hex color (e.g., #f47321)' },
          { status: 400 }
        )
      }
      updateData.color = color
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: {
        athletes: {
          select: {
            id: true,
            name: true,
            totalRaised: true
          }
        }
      }
    })

    // Return the updated team
    return NextResponse.json({
      success: true,
      team: {
        ...updatedTeam,
        athleteCount: updatedTeam.athletes.length,
        totalRaised: updatedTeam.totalRaised.toString()
      }
    })

  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate team ID
    const { id } = await params
    const teamId = parseInt(id)
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: 'Invalid team ID' },
        { status: 400 }
      )
    }

    // Fetch team with athletes
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        athletes: {
          select: {
            id: true,
            name: true,
            slug: true,
            totalRaised: true,
            goal: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Return the team data
    return NextResponse.json({
      ...team,
      athleteCount: team.athletes.length,
      totalRaised: team.totalRaised.toString(),
      athletes: team.athletes.map(athlete => ({
        ...athlete,
        totalRaised: athlete.totalRaised.toString(),
        goal: athlete.goal.toString()
      }))
    })

  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}