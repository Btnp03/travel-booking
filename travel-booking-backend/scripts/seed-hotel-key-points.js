const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const { config } = require("dotenv")
const { Pool } = require("pg")

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const pointTemplates = [
  {
    match: /grand palace|bangkok|city/i,
    points: [
      {
        label: "City access",
        detail: "A convenient base for landmark visits, dining, and transit.",
        category: "Location",
        icon: "map",
      },
      {
        label: "Flexible rooms",
        detail: "Room choices cover solo travelers, couples, and small groups.",
        category: "Room fit",
        icon: "bed",
      },
      {
        label: "Easy short stay",
        detail: "Best for quick Bangkok trips where location matters most.",
        category: "Best for",
        icon: "briefcase",
      },
    ],
  },
  {
    match: /hua hin|sand|beach|family|cabana/i,
    points: [
      {
        label: "Beachfront access",
        detail: "Close beach access keeps seaside time simple for families.",
        category: "Location",
        icon: "beach",
      },
      {
        label: "Family rooms",
        detail: "Larger room layouts support parents, kids, and longer stays.",
        category: "Room fit",
        icon: "users",
      },
      {
        label: "Kids friendly",
        detail: "A calmer resort setup makes planning with children easier.",
        category: "Amenity",
        icon: "sparkles",
      },
    ],
  },
  {
    match: /pattaya|light|rooftop|nightlife|harbor/i,
    points: [
      {
        label: "Rooftop pool",
        detail: "Skyline views make the hotel a strong social trip base.",
        category: "Amenity",
        icon: "building",
      },
      {
        label: "Walkable location",
        detail: "Close to nightlife, cafes, and local pickup points.",
        category: "Location",
        icon: "map",
      },
      {
        label: "Group friendly",
        detail: "Room mix works well for friends on quick city beach trips.",
        category: "Best for",
        icon: "users",
      },
    ],
  },
  {
    match: /phuket|lagoon|villa|wellness|pool/i,
    points: [
      {
        label: "Private villas",
        detail: "A more private stay style with resort greenery and space.",
        category: "Room fit",
        icon: "home",
      },
      {
        label: "Wellness focus",
        detail: "A slower setup for spa time, rest, and restorative trips.",
        category: "Amenity",
        icon: "leaf",
      },
      {
        label: "Pool villa upgrade",
        detail: "Premium room paths suit honeymoons and special occasions.",
        category: "Experience",
        icon: "pool",
      },
    ],
  },
  {
    match: /samui|cove|ocean|sunset|sea/i,
    points: [
      {
        label: "Ocean view",
        detail: "Sea-facing details make mornings and sunset hours memorable.",
        category: "Atmosphere",
        icon: "waves",
      },
      {
        label: "Private transfer",
        detail: "Easy arrivals and beach hopping without renting a car.",
        category: "Convenience",
        icon: "car",
      },
      {
        label: "Saltwater pool",
        detail: "A calm pool setup made for couples and quiet resets.",
        category: "Amenity",
        icon: "pool",
      },
    ],
  },
]

const fallbackPoints = [
  {
    label: "Live inventory",
    detail: "Room availability and pricing come directly from the booking system.",
    category: "Availability",
    icon: "calendar",
  },
  {
    label: "Clear room fit",
    detail: "Capacity and price make it easier to compare rooms quickly.",
    category: "Room fit",
    icon: "bed",
  },
  {
    label: "Simple booking flow",
    detail: "Move from search to room selection without losing trip context.",
    category: "Convenience",
    icon: "check",
  },
]

function choosePoints(hotel) {
  const haystack = [
    hotel.name,
    hotel.location,
    hotel.description,
    ...hotel.rooms.map((room) => room.name),
  ].join(" ")

  return (
    pointTemplates.find((template) => template.match.test(haystack))?.points ??
    fallbackPoints
  )
}

async function main() {
  const hotels = await prisma.hotel.findMany({
    include: {
      rooms: {
        orderBy: {
          price: "asc",
        },
      },
      keyPoints: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  for (const hotel of hotels) {
    const points = choosePoints(hotel)

    for (const [index, point] of points.entries()) {
      await prisma.hotelKeyPoint.upsert({
        where: {
          hotelId_label: {
            hotelId: hotel.id,
            label: point.label,
          },
        },
        update: {
          detail: point.detail,
          category: point.category,
          icon: point.icon,
          sortOrder: index,
        },
        create: {
          hotelId: hotel.id,
          label: point.label,
          detail: point.detail,
          category: point.category,
          icon: point.icon,
          sortOrder: index,
        },
      })
    }

    console.log(`${hotel.name} (${hotel.location}): ${hotel.keyPoints.length} existing, ${points.length} ensured`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
