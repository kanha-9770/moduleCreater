import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

interface FieldMetadata {
  id: string;
  label: string;
  type: string;
  sectionId: string | null;
  subformId?: string | null;
  description?: string | null;
  placeholder?: string | null;
  options?: prisma.JsonValue;
  validation?: prisma.JsonValue;
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

    console.log("Form submission API called");
    console.log("Form ID:", formId);
    console.log("Request body:", body);

    if (!body || typeof body !== "object") {
      console.log("Invalid request body");
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { recordData } = body as { recordData: { [key: string]: unknown } };

    if (!recordData || typeof recordData !== "object") {
      console.log("Invalid or missing recordData:", recordData);
      return NextResponse.json({ error: "Record data is required and must be an object" }, { status: 400 });
    }

    const hasData =
      Object.keys(recordData).length > 0 &&
      Object.values(recordData).some((value) => value !== null && value !== undefined && value !== "");

    if (!hasData) {
      console.log("Empty form data submitted");
      return NextResponse.json({ error: "Please fill out at least one field before submitting" }, { status: 400 });
    }

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
      console.log("Form not found for ID:", formId);
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const fieldMap = new Map<string, FieldMetadata>(
      form.sections.flatMap((section) =>
        [
          ...section.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            sectionId: field.sectionId,
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

    const invalidFieldIds = Object.keys(recordData).filter((fieldId) => !fieldMap.has(fieldId));
    if (invalidFieldIds.length > 0) {
      console.log("Invalid field IDs in recordData:", invalidFieldIds);
      return NextResponse.json(
        { error: `Invalid field IDs: ${invalidFieldIds.join(", ")}` },
        { status: 400 }
      );
    }

    const recordDataHash = createHash("sha256")
      .update(JSON.stringify(recordData))
      .digest("hex");

    const existingRecord = await prisma.formRecord.findFirst({
      where: {
        formId,
        recordData: {
          equals: recordData as Prisma.InputJsonValue,
        },
      },
    });

    if (existingRecord) {
      console.log("Duplicate form record detected:", existingRecord.id);
      return NextResponse.json(
        { error: "Duplicate submission detected", recordId: existingRecord.id },
        { status: 409 }
      );
    }

    const enrichedRecordData: EnrichedRecordData = Object.fromEntries(
      Object.entries(recordData).map(([fieldId, value]) => {
        const field = fieldMap.get(fieldId)!;
        return [
          fieldId,
          {
            value,
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

    for (const [fieldId, field] of fieldMap) {
      if (field.sourceModule || field.sourceForm) {
        let lookupSourceId: string | undefined;

        if (field.sourceModule) {
          const lookupSource = await prisma.lookupSource.findFirst({
            where: { sourceModuleId: field.sourceModule },
          });
          lookupSourceId = lookupSource?.id;
        } else if (field.sourceForm) {
          const lookupSource = await prisma.lookupSource.findFirst({
            where: { sourceFormId: field.sourceForm },
          });
          lookupSourceId = lookupSource?.id;
        }

        if (lookupSourceId) {
          await prisma.lookupFieldRelation.upsert({
            where: {
              lookupSourceId_formFieldId: {
                lookupSourceId,
                formFieldId: fieldId,
              },
            },
            update: {
              formId,
              moduleId: form.moduleId,
              displayField: field.displayField,
              valueField: field.valueField,
              multiple: field.multiple,
              searchable: field.searchable,
              filters: field.filters,
              updatedAt: new Date(),
            },
            create: {
              id: `lfr_${lookupSourceId}_${fieldId}`,
              lookupSourceId,
              formFieldId: fieldId,
              formId,
              moduleId: form.moduleId,
              displayField: field.displayField,
              valueField: field.valueField,
              multiple: field.multiple,
              searchable: field.searchable,
              filters: field.filters,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log(`Created/Updated LookupFieldRelation for field ${fieldId} with lookup source ${lookupSourceId}`);
        }
      }
    }

    const record = await prisma.formRecord.create({
      data: {
        formId,
        recordData: enrichedRecordData as Prisma.InputJsonValue,
        submittedBy: "anonymous",
        submittedAt: new Date(),
      },
    });

    console.log("Form record created successfully:", record.id);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
      },
      message: "Form submitted successfully",
    });
  } catch (error: any) {
    console.error("Form submission error:", error);
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