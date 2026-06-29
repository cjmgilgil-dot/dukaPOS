import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim() ?? ""
  const catId = searchParams.get("cat") ?? ""
  const branchId = searchParams.get("branch") ?? ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)

  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        ...(catId && { categoryId: catId }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        variants: {
          where: { isActive: true },
          include: {
            stocks: branchId
              ? { where: { branchId } }
              : true,
          },
          orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        },
      },
      orderBy: { name: "asc" },
      take: limit,
    })

    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
