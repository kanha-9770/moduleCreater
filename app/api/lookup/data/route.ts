import { type NextRequest, NextResponse } from "next/server"
import { LookupService } from "@/lib/lookup-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get("sourceId")
    const displayField = searchParams.get("displayField") || "name"
    const valueField = searchParams.get("valueField") || "id"
    const storeField = searchParams.get("storeField") || displayField
    const descriptionField = searchParams.get("descriptionField")
    const search = searchParams.get("search")

    console.log("Lookup data request:", {
      sourceId,
      displayField,
      valueField,
      storeField,
      descriptionField,
      search,
    })

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Source ID is required",
        },
        { status: 400 },
      )
    }

    const fieldMapping = {
      display: displayField,
      value: valueField,
      store: storeField,
      description: descriptionField || undefined,
    }

    const options = await LookupService.getLookupOptions(sourceId, fieldMapping, search || undefined)

    console.log("Returning lookup options:", options.length)

    return NextResponse.json({
      success: true,
      data: options,
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
