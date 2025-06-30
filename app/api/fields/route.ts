import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const field = await DatabaseService.createField({
      sectionId: body.sectionId,
      subformId: body.subformId,
      type: body.type,
      label: body.label,
      placeholder: body.placeholder,
      description: body.description,
      defaultValue: body.defaultValue,
      options: body.options,
      validation: body.validation,
      visible: body.visible,
      readonly: body.readonly,
      width: body.width,
      order: body.order,
    })

    return NextResponse.json({ success: true, data: field })
  } catch (error: any) {
    console.error("Error creating field:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    // This could be used to get all fields if needed
    return NextResponse.json({ success: true, data: [] })
  } catch (error: any) {
    console.error("Error fetching fields:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
