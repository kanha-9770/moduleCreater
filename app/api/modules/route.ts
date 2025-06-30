import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET() {
  try {
    const modules = await DatabaseService.getModules()
    return NextResponse.json({ success: true, data: modules })
  } catch (error: any) {
    console.error("Error fetching modules:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    const module = await DatabaseService.createModule({ name, description })
    return NextResponse.json({ success: true, data: module })
  } catch (error: any) {
    console.error("Error creating module:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
