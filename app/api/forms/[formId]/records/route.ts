import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    console.log("API: Fetching records for form:", params.formId)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined
    const sortBy = searchParams.get("sortBy") || "submittedAt"
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"
    const employeeId = searchParams.get("employeeId") || undefined
    const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom") as string) : undefined
    const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo") as string) : undefined

    console.log("API: Query params:", { page, limit, status, search, sortBy, sortOrder, employeeId, dateFrom, dateTo })

    const records = await DatabaseService.getFormRecords(params.formId, {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
      employeeId,
      dateFrom,
      dateTo
    })

    const total = await DatabaseService.getFormSubmissionCount(params.formId)

    console.log("API: Records fetched:", records.length, "Total:", total)

    return NextResponse.json({
      success: true,
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error("API: Error fetching form records:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch form records", details: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const body = await request.json()
    
    // Extract specialized fields if present
    const employeeId = body.employeeId || body.employee_id || null;
    const amount = body.amount ? parseFloat(body.amount) : null;
    const date = body.date ? new Date(body.date) : null;
    
    const record = await DatabaseService.createFormRecord(
      params.formId, 
      body.recordData, 
      body.submittedBy,
      employeeId,
      amount,
      date
    )

    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    console.error("API: Error creating form record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
