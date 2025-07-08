import { type NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database-service";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";

interface FieldMetadata {
  id: string;
  label: string;
  type: string;
  sectionId: string | null;
  subformId?: string | null;
  description?: string | null;
  placeholder?: string | null;
  options?: Prisma.JsonValue;
  validation?: Prisma.JsonValue;
  sourceModule?: string | null;
  sourceForm?: string | null;
  displayField?: string | null;
  valueField?: string | null;
  multiple?: boolean | null;
  searchable?: boolean | null;
  filters?: Prisma.JsonValue;
}

interface EnrichedRecordData {
  [key: string]: {
    value: unknown;
    label: string;
    type: string;
    sectionId: string | null;
    subformId?: string | null;
    description?: string | null;
    placeholder?: string | null;
    options?: Prisma.JsonValue;
    validation?: Prisma.JsonValue;
  };
}

export async function POST(request: NextRequest, { params }: { params: { formId: string } }): Promise<NextResponse> {
  try {
    const { formId } = params;
    const body = await request.json();

    console.log("Form submission API called", { formId, body });

    // Validate request body
    if (!body || typeof body !== "object") {
      console.log("Invalid request body", { body });
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { recordData } = body as { recordData: { [key: string]: unknown } };

    // Validate recordData
    if (!recordData || typeof recordData !== "object") {
      console.log("Invalid or missing recordData", { recordData });
      return NextResponse.json({ error: "Record data is required and must be an object" }, { status: 400 });
    }

    // Check if recordData is empty
    const hasData =
      Object.keys(recordData).length > 0 &&
      Object.values(recordData).some((value) => value !== null && value !== undefined && value !== "");

    if (!hasData) {
      console.log("Empty form data submitted", { recordData });
      return NextResponse.json({ error: "Please fill out at least one field before submitting" }, { status: 400 });
    }

    // Fetch form with sections, fields, and subforms
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        sections: {
          include: {
            fields: {
              select: {
                id: true,
                label: true,
                type: true,
                sectionId: true,
                subformId: true,
                description: true,
                placeholder: true,
                options: true,
                validation: true,
                sourceModule: true,
                sourceForm: true,
                displayField: true,
                valueField: true,
                multiple: true,
                searchable: true,
                filters: true,
              },
            },
            subforms: {
              include: {
                fields: {
                  select: {
                    id: true,
                    label: true,
                    type: true,
                    sectionId: true,
                    subformId: true,
                    description: true,
                    placeholder: true,
                    options: true,
                    validation: true,
                    sourceModule: true,
                    sourceForm: true,
                    displayField: true,
                    valueField: true,
                    multiple: true,
                    searchable: true,
                    filters: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!form) {
      console.log("Form not found", { formId });
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    console.log("Fetched form", { formId, fieldCount: form.sections.flatMap(s => s.fields).length });

    // Create a map of FormField IDs to their metadata
    const fieldMap = new Map<string, FieldMetadata>(
      form.sections.flatMap((section) =>
        [
          ...section.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            sectionId: field.sectionId,
            subformId: field.subformId,
            description: field.description,
            placeholder: field.placeholder,
            options: field.options,
            validation: field.validation,
            sourceModule: field.sourceModule,
            sourceForm: field.sourceForm,
            displayField: field.displayField,
            valueField: field.valueField,
            multiple: field.multiple,
            searchable: field.searchable,
            filters: field.filters,
          })),
          ...section.subforms.flatMap((subform) =>
            subform.fields.map((field) => ({
              id: field.id,
              label: field.label,
              type: field.type,
              sectionId: section.id,
              subformId: field.subformId,
              description: field.description,
              placeholder: field.placeholder,
              options: field.options,
              validation: field.validation,
              sourceModule: field.sourceModule,
              sourceForm: field.sourceForm,
              displayField: field.displayField,
              valueField: field.valueField,
              multiple: field.multiple,
              searchable: field.searchable,
              filters: field.filters,
            }))
          ),
        ].map((field) => [field.id, field] as [string, FieldMetadata])
      )
    );

    // Validate that all recordData keys correspond to valid FormField IDs
    const invalidFieldIds = Object.keys(recordData).filter((fieldId) => !fieldMap.has(fieldId));
    if (invalidFieldIds.length > 0) {
      console.log("Invalid field IDs in recordData", { invalidFieldIds });
      return NextResponse.json(
        { error: `Invalid field IDs: ${invalidFieldIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for duplicate form submission
    const recordDataHash = createHash("sha256")
      .update(JSON.stringify(recordData))
      .digest("hex");

    // Check for duplicate submissions by querying the appropriate table
    const tableName = await DatabaseService.getFormRecordTable(formId);
    let existingRecord = null;
    
    // This is a simplified check - in production you might want a more robust solution
    const records = await DatabaseService.getFormRecords(formId, { limit: 100 });
    existingRecord = records.find(record => 
      createHash("sha256").update(JSON.stringify(record.recordData)).digest("hex") === recordDataHash
    );

    if (existingRecord) {
      console.log("Duplicate form record detected", { recordId: existingRecord.id });
      return NextResponse.json(
        { error: "Duplicate submission detected", recordId: existingRecord.id },
        { status: 409 }
      );
    }

    // Transform recordData to include metadata
    const enrichedRecordData: EnrichedRecordData = Object.fromEntries(
      Object.entries(recordData).map(([fieldId, value]) => {
        const field = fieldMap.get(fieldId)!;
        // Normalize lookup field values
        let storeValue = value;
        if (field.type === "lookup") {
          if (Array.isArray(value)) {
            storeValue = value.map((item) =>
              item && typeof item === "object" && item.storeValue !== undefined ? item.storeValue : item
            );
          } else if (value && typeof value === "object" && (value as any).storeValue !== undefined) {
            storeValue = (value as any).storeValue;
          }
          console.log("Normalized lookup value", { fieldId, originalValue: value, storeValue });
        }
        return [
          fieldId,
          {
            value: storeValue,
            label: field.label,
            type: field.type,
            sectionId: field.sectionId,
            ...(field.subformId ? { subformId: field.subformId } : {}),
            ...(field.description ? { description: field.description } : {}),
            ...(field.placeholder ? { placeholder: field.placeholder } : {}),
            ...(field.options ? { options: field.options } : {}),
            ...(field.validation ? { validation: field.validation } : {}),
          },
        ];
      })
    );

    console.log("Enriched record data", { enrichedRecordData });

    // Create the form record
    // Extract specialized fields if present
    const employeeId = recordData.employee_id || recordData.employeeId || null;
    const amount = recordData.amount ? parseFloat(recordData.amount) : null;
    const date = recordData.date ? new Date(recordData.date) : null;
    
    const record = await DatabaseService.createFormRecord(
      formId,
      enrichedRecordData as Prisma.InputJsonValue,
      "anonymous",
      employeeId,
      amount,
      date
    );

    console.log("Form record created successfully", { recordId: record.id });

    await DatabaseService.trackFormEvent(
      formId,
      "submit",
      {
        recordId: record.id,
        timestamp: new Date().toISOString(),
      }
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit form",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}