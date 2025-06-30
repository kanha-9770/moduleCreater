import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sectionId, title, description, order } = body

    if (!sectionId || !title) {
      return NextResponse.json({ success: false, error: "Section ID and title are required" }, { status: 400 })
    }

    const subform = await prisma.subform.create({
      data: {
        sectionId,
        title,
        description,
        order: order || 0,
      },
      include: {
        fields: true,
        records: true,
      },
    })

    return NextResponse.json({ success: true, data: subform })
  } catch (error: any) {
    console.error("Error creating subform:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
