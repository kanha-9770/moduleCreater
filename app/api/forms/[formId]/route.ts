import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: Request, { params }: { params: { formId: string } }) {
  try {
    const form = await DatabaseService.getForm(params.formId)
    console.log("Fetched form:", form);
    
    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found akash" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: form })
  } catch (error: any) {
    console.error("Error fetching form:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { formId: string } }) {
  try {
    const body = await request.json()
    const form = await DatabaseService.updateForm(params.formId, body)
    return NextResponse.json({ success: true, data: form })
  } catch (error: any) {
    console.error("Error updating form:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { formId: string } }) {
  try {
    await DatabaseService.deleteForm(params.formId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting form:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
