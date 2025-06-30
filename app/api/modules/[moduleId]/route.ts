import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: Request, { params }: { params: { moduleId: string } }) {
  try {
    const module = await DatabaseService.getModule(params.moduleId)
    if (!module) {
      return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: module })
  } catch (error: any) {
    console.error("Error fetching module:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { moduleId: string } }) {
  try {
    const body = await request.json()
    const module = await DatabaseService.updateModule(params.moduleId, body)
    return NextResponse.json({ success: true, data: module })
  } catch (error: any) {
    console.error("Error updating module:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { moduleId: string } }) {
  try {
    await DatabaseService.deleteModule(params.moduleId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting module:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
