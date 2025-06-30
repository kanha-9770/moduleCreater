import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: { subformId: string } }) {
  try {
    const body = await request.json()
    const subform = await prisma.subform.update({
      where: { id: params.subformId },
      data: body,
      include: {
        fields: true,
        records: true,
      },
    })
    return NextResponse.json({ success: true, data: subform })
  } catch (error: any) {
    console.error("Error updating subform:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { subformId: string } }) {
  try {
    await prisma.subform.delete({
      where: { id: params.subformId },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting subform:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
