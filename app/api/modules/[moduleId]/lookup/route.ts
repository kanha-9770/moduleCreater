import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET(request: Request, { params }: { params: { moduleId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    console.log("Module lookup API called:", params.moduleId, search)

    // Get the module and its forms
    const module = await DatabaseService.getModule(params.moduleId)
    if (!module) {
      return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 })
    }

    // Collect all records from all forms in the module
    const allRecords: any[] = []

    for (const form of module.forms) {
      const records = await DatabaseService.getFormRecords(form.id)
      const formattedRecords = records.map((record) => ({
        id: record.id,
        value: record.id,
        label:
          record.recordData.name ||
          record.recordData.title ||
          record.recordData.email ||
          `Record ${record.id.slice(-8)}`,
        description: record.recordData.description || record.recordData.email || `From ${form.name}`,
        formId: form.id,
        formName: form.name,
        recordData: record.recordData,
        submittedAt: record.submittedAt,
      }))
      allRecords.push(...formattedRecords)
    }

    // Filter by search term if provided
    let filteredRecords = allRecords
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRecords = allRecords.filter(
        (record) =>
          record.label.toLowerCase().includes(searchLower) ||
          record.description.toLowerCase().includes(searchLower) ||
          Object.values(record.recordData).some((value) => String(value).toLowerCase().includes(searchLower)),
      )
    }

    // Apply limit
    const limitedRecords = filteredRecords.slice(0, limit)

    console.log("Module lookup returning:", limitedRecords.length, "records")

    return NextResponse.json({
      success: true,
      data: limitedRecords,
      total: filteredRecords.length,
      limit: limit,
    })
  } catch (error: any) {
    console.error("Error in module lookup API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch module lookup data",
      },
      { status: 500 },
    )
  }
}
