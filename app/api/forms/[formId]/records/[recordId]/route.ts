import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: Request, { params }: { params: { formId: string; recordId: string } }) {
  try {
    const records = await DatabaseService.getFormRecords(params.formId)
    const record = records.find((r) => r.id === params.recordId)

    if (!record) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("Error fetching form record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { formId: string; recordId: string } }) {
  try {
    const body = await request.json()
    const record = await DatabaseService.updateFormRecord(params.recordId, body)
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("Error updating form record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { formId: string; recordId: string } }) {
  try {
    await DatabaseService.deleteFormRecord(params.recordId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting form record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
