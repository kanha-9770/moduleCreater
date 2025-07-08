"use server"

import { DatabaseService } from "@/lib/database-service"

export async function handleSubmit(
  formId: string, 
  formData: FormData, 
  userAgent: string,
  employeeId?: string,
  amount?: number,
  date?: Date
) {
  try {
    const recordData: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        recordData[key] = value.name
      } else {
        recordData[key] = value
      }
    }

    const result = await DatabaseService.createFormRecord(
      formId,
      recordData,
      "anonymous",
      employeeId,
      amount,
      date
    )

    await DatabaseService.trackFormEvent(
      formId,
      "submit",
      {
        recordId: result.id,
        timestamp: new Date().toISOString(),
      },
      undefined,
      userAgent
    )

    return { success: true, data: result }
  } catch (error: any) {
    console.error("Submission error:", error)
    return { success: false, error: error.message || "Submission failed" }
  }
}