import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    console.log("API: Fetching detailed lookup sources for form:", params.formId)

    const result = await DatabaseService.getLookupSources(params.formId)

    console.log("API: Detailed lookup sources fetched:", result.sources.length)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error("API: Error fetching lookup sources:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch lookup sources", details: error.message },
      { status: 500 },
    )
  }
}
