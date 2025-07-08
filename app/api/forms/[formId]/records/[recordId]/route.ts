import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: Request, { params }: { params: { formId: string; recordId: string } }) {
  try {
    const record = await DatabaseService.getFormRecord(params.recordId)
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("Error fetching record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { formId: string; recordId: string } }) {
  try {
    const body = await request.json()
    
    // Extract specialized fields if present
    const updates = {
      ...body,
      employee_id: body.employeeId || body.employee_id || undefined,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      date: body.date ? new Date(body.date) : undefined
    }
    
    const record = await DatabaseService.updateFormRecord(params.recordId, updates)
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("Error updating record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { formId: string; recordId: string } }) {
  try {
    await DatabaseService.deleteFormRecord(params.recordId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}