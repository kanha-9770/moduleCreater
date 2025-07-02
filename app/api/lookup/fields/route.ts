import { type NextRequest, NextResponse } from "next/server"
import { LookupService } from "@/lib/lookup-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get("sourceId")

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Source ID is required",
        },
        { status: 400 },
      )
    }

    console.log("Fetching fields for source:", sourceId)

    const lookupService = new LookupService()
    const fields = await lookupService.getFields(sourceId)

    console.log(`Found ${fields.length} fields for source ${sourceId}`)

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
