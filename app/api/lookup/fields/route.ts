import { type NextRequest, NextResponse } from "next/server"
import { LookupService } from "@/lib/lookup-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get("sourceId")

    console.log("Fetching fields for source:", sourceId)

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Source ID is required",
        },
        { status: 400 },
      )
    }

    const fields = await LookupService.getSourceFields(sourceId)

    console.log("Found fields:", fields)

    return NextResponse.json({
      success: true,
      data: fields,
    })
  } catch (error) {
    console.error("Error fetching lookup fields:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lookup fields",
      },
      { status: 500 },
    )
  }
}
