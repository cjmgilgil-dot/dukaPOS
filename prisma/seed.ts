import { PrismaClient, UserRole, UnitOfMeasure } from "../src/lib/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // ── Branch ──────────────────────────────────────────────────────────────
  const branch = await db.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: {
      id: "branch-main",
      name: "Main Shop",
      address: "Tom Mboya St, Nairobi",
      kraPIN: "P0123456789A",
      isActive: true,
    },
  })
  console.log("✓ Branch created:", branch.name)

  // ── Users ────────────────────────────────────────────────────────────────
  const users = [
    {
      id: "user-owner",
      name: "Shop Owner",
      email: "owner@dukapos.co.ke",
      password: "owner123",
      pin: "1234",
      role: UserRole.OWNER,
    },
    {
      id: "user-manager",
      name: "Store Manager",
      email: "manager@dukapos.co.ke",
      password: "manager123",
      pin: "5678",
      role: UserRole.MANAGER,
    },
    {
      id: "user-cashier1",
      name: "John Kamau",
      email: null,
      password: null,
      pin: "1111",
      role: UserRole.CASHIER,
    },
    {
      id: "user-cashier2",
      name: "Mary Wanjiku",
      email: null,
      password: null,
      pin: "2222",
      role: UserRole.CASHIER,
    },
  ]

  for (const u of users) {
    const passwordHash = u.password ? await bcrypt.hash(u.password, 12) : null
    const pinHash = await bcrypt.hash(u.pin, 12)

    await db.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        branchId: branch.id,
        name: u.name,
        email: u.email,
        passwordHash,
        pinHash,
        role: u.role,
        isActive: true,
      },
    })
    console.log(`✓ User: ${u.name} (${u.role})`)
  }

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryData = [
    { id: "cat-electrical", name: "Electrical", icon: "⚡", color: "#f59e0b", sortOrder: 1 },
    { id: "cat-plumbing", name: "Plumbing", icon: "🔧", color: "#3b82f6", sortOrder: 2 },
    { id: "cat-tools", name: "Tools", icon: "🛠", color: "#8b5cf6", sortOrder: 3 },
    { id: "cat-lighting", name: "Lighting", icon: "💡", color: "#eab308", sortOrder: 4 },
    { id: "cat-electronics", name: "Electronics", icon: "📺", color: "#06b6d4", sortOrder: 5 },
    { id: "cat-paint", name: "Paint", icon: "🎨", color: "#ec4899", sortOrder: 6 },
    { id: "cat-hardware", name: "Hardware", icon: "🔩", color: "#6b7280", sortOrder: 7 },
  ]

  for (const c of categoryData) {
    await db.category.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }
  console.log("✓ Categories created:", categoryData.length)

  // ── Products with variants ─────────────────────────────────────────────────
  const products = [
    {
      id: "prod-twin-cable-25",
      sku: "EL-TC-2.5",
      name: "2.5mm² Twin & Earth Cable",
      categoryId: "cat-electrical",
      variants: [
        { id: "var-tc25-meter", name: "Per Meter", unit: UnitOfMeasure.METER, price: 35, cost: 22, isDefault: true, stock: 500, reorder: 100 },
        { id: "var-tc25-roll", name: "Per Roll (100m)", unit: UnitOfMeasure.ROLL, conversionFactor: 100, price: 3200, cost: 2000, stock: 15, reorder: 5 },
      ],
    },
    {
      id: "prod-single-cable-4",
      sku: "EL-SC-4",
      name: "4mm² Single Core Cable",
      categoryId: "cat-electrical",
      variants: [
        { id: "var-sc4-meter", name: "Per Meter", unit: UnitOfMeasure.METER, price: 25, cost: 16, isDefault: true, stock: 800, reorder: 150 },
        { id: "var-sc4-roll", name: "Per Roll (100m)", unit: UnitOfMeasure.ROLL, conversionFactor: 100, price: 2300, cost: 1500, stock: 20, reorder: 5 },
      ],
    },
    {
      id: "prod-socket-13a",
      sku: "EL-SK-13A",
      name: "13A Socket Outlet (Single)",
      categoryId: "cat-electrical",
      variants: [
        { id: "var-socket-13a", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 350, cost: 220, isDefault: true, stock: 120, reorder: 30 },
      ],
    },
    {
      id: "prod-mcb-32a",
      sku: "EL-MCB-32",
      name: "32A MCB Single Pole",
      categoryId: "cat-electrical",
      variants: [
        { id: "var-mcb-32a", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 450, cost: 280, isDefault: true, stock: 80, reorder: 20 },
      ],
    },
    {
      id: "prod-led-9w",
      sku: "LT-LED-9W",
      name: "LED Bulb 9W E27",
      categoryId: "cat-lighting",
      variants: [
        { id: "var-led-9w", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 180, cost: 110, isDefault: true, stock: 200, reorder: 50 },
      ],
    },
    {
      id: "prod-pvc-pipe-half",
      sku: "PL-PVC-0.5",
      name: "PVC Pipe ½ inch",
      categoryId: "cat-plumbing",
      variants: [
        { id: "var-pvc-half-meter", name: "Per Meter", unit: UnitOfMeasure.METER, price: 85, cost: 55, isDefault: true, stock: 300, reorder: 60 },
        { id: "var-pvc-half-length", name: "Per Length (6m)", unit: UnitOfMeasure.PIECE, conversionFactor: 6, price: 480, cost: 310, stock: 60, reorder: 15 },
      ],
    },
    {
      id: "prod-gate-valve-half",
      sku: "PL-GV-0.5",
      name: "Gate Valve ½ inch",
      categoryId: "cat-plumbing",
      variants: [
        { id: "var-gate-valve-half", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 650, cost: 420, isDefault: true, stock: 50, reorder: 15 },
      ],
    },
    {
      id: "prod-hammer-claw",
      sku: "TL-HMR-16",
      name: "Hammer Claw 16oz",
      categoryId: "cat-tools",
      variants: [
        { id: "var-hammer-claw", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 800, cost: 520, isDefault: true, stock: 35, reorder: 10 },
      ],
    },
    {
      id: "prod-screwdriver-set",
      sku: "TL-SDR-6PC",
      name: "Screwdriver Set 6pc",
      categoryId: "cat-tools",
      variants: [
        { id: "var-screwdriver-set", name: "Per Set", unit: UnitOfMeasure.SET, price: 550, cost: 350, isDefault: true, stock: 45, reorder: 10 },
      ],
    },
    {
      id: "prod-paint-brush-4",
      sku: "PT-PB-4IN",
      name: "Paint Brush 4 inch",
      categoryId: "cat-paint",
      variants: [
        { id: "var-paint-brush-4", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 250, cost: 160, isDefault: true, stock: 60, reorder: 20 },
      ],
    },
    {
      id: "prod-dulux-4l",
      sku: "PT-DLX-4L",
      name: "Dulux Weathershield 4L",
      categoryId: "cat-paint",
      variants: [
        { id: "var-dulux-4l", name: "Per Tin", unit: UnitOfMeasure.PACK, price: 3500, cost: 2600, isDefault: true, stock: 25, reorder: 8 },
      ],
    },
    {
      id: "prod-concrete-nails",
      sku: "HW-CN-3IN",
      name: "Concrete Nails 3 inch",
      categoryId: "cat-hardware",
      variants: [
        { id: "var-cnails-kg", name: "Per Kg", unit: UnitOfMeasure.KILOGRAM, price: 200, cost: 130, isDefault: true, stock: 80, reorder: 20 },
        { id: "var-cnails-pack", name: "Per Pack (5kg)", unit: UnitOfMeasure.PACK, conversionFactor: 5, price: 950, cost: 620, stock: 30, reorder: 8 },
      ],
    },
    {
      id: "prod-padlock-50",
      sku: "HW-PDL-50",
      name: "Padlock 50mm",
      categoryId: "cat-hardware",
      variants: [
        { id: "var-padlock-50", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 400, cost: 260, isDefault: true, stock: 70, reorder: 20 },
      ],
    },
    {
      id: "prod-door-hinge-4",
      sku: "HW-HNG-4IN",
      name: "Door Hinge 4 inch",
      categoryId: "cat-hardware",
      variants: [
        { id: "var-door-hinge-4", name: "Per Pair", unit: UnitOfMeasure.PAIR, price: 300, cost: 190, isDefault: true, stock: 100, reorder: 25 },
      ],
    },
    {
      id: "prod-extension-5m",
      sku: "EL-EXT-5M",
      name: "Extension Cable 5m",
      categoryId: "cat-electrical",
      variants: [
        { id: "var-extension-5m", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 1200, cost: 780, isDefault: true, stock: 30, reorder: 10 },
      ],
    },
    {
      id: "prod-samsung-tv-32",
      sku: "EL-TV-S32",
      name: "Samsung 32\" LED TV",
      categoryId: "cat-electronics",
      variants: [
        { id: "var-samsung-tv-32", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 22000, cost: 17000, isDefault: true, stock: 8, reorder: 2 },
      ],
    },
    {
      id: "prod-bosch-drill",
      sku: "TL-DRL-BSC",
      name: "Bosch Drill Machine",
      categoryId: "cat-tools",
      variants: [
        { id: "var-bosch-drill", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 8500, cost: 6200, isDefault: true, stock: 12, reorder: 3 },
      ],
    },
    {
      id: "prod-m8-bolt-set",
      sku: "HW-BLT-M8",
      name: "M8 Bolt & Nut Set",
      categoryId: "cat-hardware",
      variants: [
        { id: "var-m8-bolt-piece", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 15, cost: 8, isDefault: true, stock: 500, reorder: 100 },
        { id: "var-m8-bolt-pack", name: "Per Pack (50pcs)", unit: UnitOfMeasure.PACK, conversionFactor: 50, price: 650, cost: 380, stock: 40, reorder: 10 },
      ],
    },
    {
      id: "prod-tape-measure-5m",
      sku: "TL-TM-5M",
      name: "Tape Measure 5m",
      categoryId: "cat-tools",
      variants: [
        { id: "var-tape-measure-5m", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 350, cost: 220, isDefault: true, stock: 40, reorder: 10 },
      ],
    },
    {
      id: "prod-safety-helmet",
      sku: "HW-SHM-STD",
      name: "Safety Helmet",
      categoryId: "cat-hardware",
      variants: [
        { id: "var-safety-helmet", name: "Per Piece", unit: UnitOfMeasure.PIECE, price: 600, cost: 390, isDefault: true, stock: 30, reorder: 8 },
      ],
    },
  ]

  for (const p of products) {
    const { variants, ...productData } = p

    await db.product.upsert({
      where: { id: productData.id },
      update: {},
      create: {
        id: productData.id,
        sku: productData.sku,
        name: productData.name,
        categoryId: productData.categoryId,
        taxRate: 16,
        isActive: true,
        isDeleted: false,
      },
    })

    for (const v of variants) {
      const { stock, reorder, ...variantData } = v

      const conversionFactor = "conversionFactor" in variantData ? variantData.conversionFactor : 1

      await db.productVariant.upsert({
        where: { id: variantData.id },
        update: {},
        create: {
          id: variantData.id,
          productId: productData.id,
          name: variantData.name,
          unit: variantData.unit,
          conversionFactor,
          price: variantData.price,
          cost: variantData.cost,
          isDefault: "isDefault" in variantData ? (variantData.isDefault ?? false) : false,
          isActive: true,
        },
      })

      // Stock record
      await db.productStock.upsert({
        where: {
          productVariantId_branchId: {
            productVariantId: variantData.id,
            branchId: branch.id,
          },
        },
        update: {},
        create: {
          productVariantId: variantData.id,
          branchId: branch.id,
          quantity: stock,
          reorderLevel: reorder,
        },
      })

      // Initial stock movement
      const existingMovement = await db.stockMovement.findFirst({
        where: {
          productVariantId: variantData.id,
          branchId: branch.id,
          type: "INITIAL",
        },
      })

      if (!existingMovement) {
        await db.stockMovement.create({
          data: {
            productVariantId: variantData.id,
            branchId: branch.id,
            type: "INITIAL",
            quantity: stock,
            notes: "Initial stock",
          },
        })
      }
    }
  }

  console.log(`✓ Products created: ${products.length}`)

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)
  console.log(`✓ Variants created: ${totalVariants}`)
  console.log("\n✅ Seed complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
