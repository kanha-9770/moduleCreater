import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined
    const sortBy = searchParams.get("sortBy") || "submittedAt"
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"

    const records = await db.getFormRecords(params.formId, {
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
    })

    const total = await db.getFormSubmissionCount(params.formId)

    return NextResponse.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error("Error fetching form records:", error)
    return NextResponse.json({ error: "Failed to fetch form records", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const body = await request.json()
    const { recordData, submittedBy } = body

    if (!recordData || typeof recordData !== "object") {
      return NextResponse.json({ error: "Invalid record data" }, { status: 400 })
    }

    const record = await db.createFormRecord(params.formId, recordData, submittedBy)

    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    console.error("Error creating form record:", error)
    return NextResponse.json({ error: "Failed to create form record", details: error.message }, { status: 500 })
  }
}
