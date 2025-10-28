import { PrismaClient } from '@prisma/client'
import seedData from './seed-data.json'

type AthleteData = {
  name: string
  slug: string
  team: string
  bio: string
  goal: number
  photoUrl?: string
}

const typedSeedData = seedData as {
  teams: Array<{ name: string; color: string }>
  athletes: AthleteData[]
}

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.donation.deleteMany()
  await prisma.athlete.deleteMany()
  await prisma.team.deleteMany()

  // Seed teams
  console.log('Seeding teams...')
  for (const team of typedSeedData.teams) {
    await prisma.team.create({
      data: {
        name: team.name,
        color: team.color
      }
    })
  }

  // Seed athletes
  console.log('Seeding athletes...')
  for (const athlete of typedSeedData.athletes) {
    const team = await prisma.team.findUnique({
      where: { name: athlete.team }
    })

    if (!team) {
      console.error(`Team ${athlete.team} not found for athlete ${athlete.name}`)
      continue
    }

    await prisma.athlete.create({
      data: {
        name: athlete.name,
        slug: athlete.slug,
        bio: athlete.bio,
        photoUrl: athlete.photoUrl,
        teamId: team.id,
        goal: athlete.goal
      }
    })
  }

  // Get counts for verification
  const teamCount = await prisma.team.count()
  const athleteCount = await prisma.athlete.count()

  console.log(`Seed completed successfully!`)
  console.log(`- ${teamCount} teams created`)
  console.log(`- ${athleteCount} athletes created`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
