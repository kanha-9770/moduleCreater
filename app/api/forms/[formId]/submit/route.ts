import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { formId: string } }) {
  try {
    const { formId } = params
    const body = await request.json()

    console.log("Form submission API called")
    console.log("Form ID:", formId)
    console.log("Request body:", body)

    // Validate request body
    if (!body || typeof body !== "object") {
      console.log("Invalid request body")
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { recordData } = body

    // Validate recordData
    if (!recordData || typeof recordData !== "object") {
      console.log("Invalid or missing recordData:", recordData)
      return NextResponse.json({ error: "Record data is required and must be an object" }, { status: 400 })
    }

    // Check if recordData is empty
    const hasData =
      Object.keys(recordData).length > 0 &&
      Object.values(recordData).some((value) => value !== null && value !== undefined && value !== "")

    if (!hasData) {
      console.log("Empty form data submitted")
      return NextResponse.json({ error: "Please fill out at least one field before submitting" }, { status: 400 })
    }

    console.log("Creating form record with data:", recordData)

    // Create the form record
    const record = await prisma.formRecord.create({
      data: {
        formId,
        recordData,
        submittedBy: "anonymous",
        submittedAt: new Date(),
      },
    })

    console.log("Form record created successfully:", record.id)

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
      },
      message: "Form submitted successfully",
    })
  } catch (error: any) {
    console.error("Form submission error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit form",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
