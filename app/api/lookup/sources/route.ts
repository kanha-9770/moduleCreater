import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching lookup sources...")

    // Get all forms
    const forms = await prisma.form.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            records: true,
          },
        },
      },
      where: {
        isPublished: true,
      },
    })

    // Get all modules
    const modules = await prisma.formModule.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            forms: true,
          },
        },
      },
    })

    // Static sources
    const staticSources = [
      {
        id: "countries",
        name: "Countries",
        type: "static",
        description: "List of world countries",
        recordCount: 195,
      },
      {
        id: "currencies",
        name: "Currencies",
        type: "static",
        description: "World currencies",
        recordCount: 168,
      },
      {
        id: "priorities",
        name: "Priorities",
        type: "static",
        description: "Priority levels (Low, Medium, High, Critical)",
        recordCount: 4,
      },
      {
        id: "statuses",
        name: "Status Options",
        type: "static",
        description: "Common status values",
        recordCount: 6,
      },
      {
        id: "departments",
        name: "Departments",
        type: "static",
        description: "Common organizational departments",
        recordCount: 12,
      },
    ]

    // Format sources
    const sources = [
      ...staticSources,
      ...forms.map((form) => ({
        id: form.id,
        name: form.name,
        type: "form" as const,
        description: form.description || `Form with ${form._count.records} records`,
        recordCount: form._count.records,
      })),
      ...modules.map((module) => ({
        id: module.id,
        name: module.name,
        type: "module" as const,
        description: module.description || `Module with ${module._count.forms} forms`,
        recordCount: module._count.forms,
      })),
    ]

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
