import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    console.log("API: Fetching form:", params.formId)

    const form = await DatabaseService.getForm(params.formId)

    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 })
    }

    console.log("API: Form fetched successfully:", form.name)
    return NextResponse.json({ success: true, data: form })
  } catch (error: any) {
    console.error("API: Error fetching form:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const body = await request.json()
    const form = await DatabaseService.updateForm(params.formId, body)
    return NextResponse.json({ success: true, data: form })
  } catch (error: any) {
    console.error("API: Error updating form:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    await DatabaseService.deleteForm(params.formId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API: Error deleting form:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
