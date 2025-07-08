import { type NextRequest, NextResponse } from "next/server"
import { LookupService } from "@/lib/lookup-service"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching lookup sources...")

    // Use LookupService to get sources
    const sources = await LookupService.getLookupSources()

    console.log(`Found ${sources.length} lookup sources`)

    return NextResponse.json({
      success: true,
      data: sources,
    })
  } catch (error) {
    console.error("Error fetching lookup sources:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lookup sources",
      },
      { status: 500 },
    )
  }
}
