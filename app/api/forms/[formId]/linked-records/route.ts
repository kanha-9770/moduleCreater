import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    console.log("API: Fetching detailed linked records for form:", params.formId)

    const result = await DatabaseService.getLinkedRecords(params.formId)

    console.log("API: Detailed linked records fetched:", result.linkedForms.length)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error("API: Error fetching linked records:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch linked records", details: error.message },
      { status: 500 },
    )
  }
}
