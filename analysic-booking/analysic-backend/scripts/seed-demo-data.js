const bcrypt = require("bcrypt")
const { PrismaClient, Role } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const { config } = require("dotenv")
const { Pool } = require("pg")

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const demoPassword = "password123"

const hotels = [
  {
    name: "Solara Bangkok Riverside",
    description:
      "A city hotel near the river, transit, temples, restaurants, and weekend markets.",
    location: "Bangkok",
    images: [
      "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80",
    ],
    keyPoints: [
      {
        label: "City access",
        detail: "Close to river piers, BTS connections, and landmark routes.",
        category: "Location",
        icon: "map",
      },
      {
        label: "Business ready",
        detail: "Quiet rooms and easy transport make short work trips simple.",
        category: "Best for",
        icon: "briefcase",
      },
      {
        label: "Riverside dining",
        detail: "Evening food spots and river views are within easy reach.",
        category: "Experience",
        icon: "sparkles",
      },
    ],
    rooms: [
      { name: "Riverside Deluxe King", price: 2600, capacity: 2, quantity: 6 },
      { name: "Skyline Twin", price: 2200, capacity: 2, quantity: 5 },
    ],
  },
  {
    name: "Hua Hin Family Cabana",
    description:
      "A relaxed beach stay built for family weekends, slow mornings, and seaside meals.",
    location: "Hua Hin",
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    ],
    keyPoints: [
      {
        label: "Beachfront access",
        detail: "A short walk from rooms to sand, cafes, and sunset views.",
        category: "Location",
        icon: "beach",
      },
      {
        label: "Family rooms",
        detail: "Larger layouts support parents, kids, and longer stays.",
        category: "Room fit",
        icon: "users",
      },
      {
        label: "Calm weekend",
        detail: "A quieter resort setup for guests who want an easy reset.",
        category: "Atmosphere",
        icon: "leaf",
      },
    ],
    rooms: [
      { name: "Family Cabana Suite", price: 4200, capacity: 4, quantity: 4 },
      { name: "Garden Twin Room", price: 2800, capacity: 2, quantity: 6 },
    ],
  },
  {
    name: "Phuket Lagoon Villas",
    description:
      "Private villa stays with pool access, resort greenery, and a slower island rhythm.",
    location: "Phuket",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    ],
    keyPoints: [
      {
        label: "Private villas",
        detail: "Spacious rooms for couples and small groups who want privacy.",
        category: "Room fit",
        icon: "home",
      },
      {
        label: "Wellness focus",
        detail: "A softer stay style for spa time, pool time, and quiet days.",
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
    rooms: [
      { name: "Lagoon Pool Villa", price: 7800, capacity: 2, quantity: 3 },
      { name: "Two Bedroom Garden Villa", price: 9800, capacity: 4, quantity: 2 },
    ],
  },
]

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

async function upsertUser({ email, phone, role }) {
  const password = await bcrypt.hash(demoPassword, 10)

  return prisma.user.upsert({
    where: { email },
    update: { phone, role },
    create: { email, phone, password, role },
  })
}

async function upsertHotel(data) {
  const existing = await prisma.hotel.findFirst({
    where: { name: data.name },
  })

  if (existing) {
    return prisma.hotel.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        location: data.location,
        images: data.images,
      },
    })
  }

  return prisma.hotel.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      images: data.images,
    },
  })
}

async function upsertRoom(hotelId, data) {
  const existing = await prisma.room.findFirst({
    where: {
      hotelId,
      name: data.name,
    },
  })

  if (existing) {
    return prisma.room.update({
      where: { id: existing.id },
      data,
    })
  }

  return prisma.room.create({
    data: {
      ...data,
      hotelId,
    },
  })
}

async function ensureInventory(roomId, quantity) {
  const today = startOfUtcDay(new Date())
  const data = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + index)

    return {
      roomId,
      date,
      available: quantity,
    }
  })

  await prisma.roomInventory.createMany({
    data,
    skipDuplicates: true,
  })
}

async function ensureKeyPoints(hotelId, points) {
  for (const [index, point] of points.entries()) {
    await prisma.hotelKeyPoint.upsert({
      where: {
        hotelId_label: {
          hotelId,
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
        hotelId,
        label: point.label,
        detail: point.detail,
        category: point.category,
        icon: point.icon,
        sortOrder: index,
      },
    })
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env first.")
  }

  const admin = await upsertUser({
    email: "admin@solara.test",
    phone: "+66000000001",
    role: Role.ADMIN,
  })
  const user = await upsertUser({
    email: "user@solara.test",
    phone: "+66000000002",
    role: Role.USER,
  })

  console.log(`Demo users ready: ${admin.email}, ${user.email}`)

  for (const hotelData of hotels) {
    const hotel = await upsertHotel(hotelData)
    await ensureKeyPoints(hotel.id, hotelData.keyPoints)

    for (const roomData of hotelData.rooms) {
      const room = await upsertRoom(hotel.id, roomData)
      await ensureInventory(room.id, room.quantity)
    }

    console.log(`Hotel ready: ${hotel.name}`)
  }

  console.log("")
  console.log("Demo data is ready.")
  console.log(`Admin login: admin@solara.test / ${demoPassword}`)
  console.log(`User login: user@solara.test / ${demoPassword}`)
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
