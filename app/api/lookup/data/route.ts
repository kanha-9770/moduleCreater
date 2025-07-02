import { type NextRequest, NextResponse } from "next/server"
import { LookupService } from "@/lib/lookup-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get("sourceId")
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Source ID is required",
        },
        { status: 400 },
      )
    }

    console.log("Fetching lookup data:", { sourceId, search, limit, offset })

    const lookupService = new LookupService()
    const data = await lookupService.getData(sourceId, { search, limit, offset })

    console.log(`Returning ${data.length} records for source ${sourceId}`)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error fetching lookup data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lookup data",
      },
      { status: 500 },
    )
  }
}
