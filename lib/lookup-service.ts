import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface LookupOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

interface LookupSourceData {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  recordCount: number;
  icon: string;
}

export class LookupService {
  private staticSources: Record<string, any[]> = {
    countries: [
      { id: "US", name: "United States", code: "US", description: "United States of America" },
      { id: "CA", name: "Canada", code: "CA", description: "Canada" },
      { id: "UK", name: "United Kingdom", code: "UK", description: "United Kingdom" },
      { id: "DE", name: "Germany", code: "DE", description: "Germany" },
      { id: "FR", name: "France", code: "FR", description: "France" },
      { id: "JP", name: "Japan", code: "JP", description: "Japan" },
      { id: "AU", name: "Australia", code: "AU", description: "Australia" },
      { id: "IN", name: "India", code: "IN", description: "India" },
      { id: "BR", name: "Brazil", code: "BR", description: "Brazil" },
      { id: "CN", name: "China", code: "CN", description: "China" },
    ],
    currencies: [
      { id: "USD", name: "US Dollar", code: "USD", symbol: "$", description: "United States Dollar" },
      { id: "EUR", name: "Euro", code: "EUR", symbol: "€", description: "Euro" },
      { id: "GBP", name: "British Pound", code: "GBP", symbol: "£", description: "British Pound Sterling" },
      { id: "JPY", name: "Japanese Yen", code: "JPY", symbol: "¥", description: "Japanese Yen" },
      { id: "CAD", name: "Canadian Dollar", code: "CAD", symbol: "C$", description: "Canadian Dollar" },
      { id: "AUD", name: "Australian Dollar", code: "AUD", symbol: "A$", description: "Australian Dollar" },
      { id: "CHF", name: "Swiss Franc", code: "CHF", symbol: "CHF", description: "Swiss Franc" },
      { id: "CNY", name: "Chinese Yuan", code: "CNY", symbol: "¥", description: "Chinese Yuan" },
    ],
    priorities: [
      { id: "low", name: "Low", value: 1, color: "green", description: "Low priority" },
      { id: "medium", name: "Medium", value: 2, color: "yellow", description: "Medium priority" },
      { id: "high", name: "High", value: 3, color: "orange", description: "High priority" },
      { id: "critical", name: "Critical", value: 4, color: "red", description: "Critical priority" },
    ],
    statuses: [
      { id: "draft", name: "Draft", color: "gray", description: "Draft status" },
      { id: "pending", name: "Pending", color: "yellow", description: "Pending approval" },
      { id: "approved", name: "Approved", color: "green", description: "Approved" },
      { id: "rejected", name: "Rejected", color: "red", description: "Rejected" },
      { id: "completed", name: "Completed", color: "blue", description: "Completed" },
      { id: "cancelled", name: "Cancelled", color: "gray", description: "Cancelled" },
    ],
    departments: [
      { id: "hr", name: "Human Resources", code: "HR", description: "Human Resources Department" },
      { id: "it", name: "Information Technology", code: "IT", description: "IT Department" },
      { id: "finance", name: "Finance", code: "FIN", description: "Finance Department" },
      { id: "marketing", name: "Marketing", code: "MKT", description: "Marketing Department" },
      { id: "sales", name: "Sales", code: "SAL", description: "Sales Department" },
      { id: "operations", name: "Operations", code: "OPS", description: "Operations Department" },
      { id: "legal", name: "Legal", code: "LEG", description: "Legal Department" },
      { id: "support", name: "Customer Support", code: "SUP", description: "Customer Support" },
    ],
  };

  async seedStaticSources(): Promise<void> {
    const staticSourceConfigs = [
      { id: "lookup_countries", name: "Countries", staticSourceName: "countries", description: "World countries with codes and regions", data: this.staticSources.countries },
      { id: "lookup_currencies", name: "Currencies", staticSourceName: "currencies", description: "World currencies with symbols", data: this.staticSources.currencies },
      { id: "lookup_priorities", name: "Priorities", staticSourceName: "priorities", description: "Task and project priorities", data: this.staticSources.priorities },
      { id: "lookup_statuses", name: "Status Options", staticSourceName: "statuses", description: "Common status values", data: this.staticSources.statuses },
      { id: "lookup_departments", name: "Departments", staticSourceName: "departments", description: "Common company departments", data: this.staticSources.departments },
    ];

    for (const config of staticSourceConfigs) {
      await prisma.lookupSource.upsert({
        where: { id: config.id },
        update: {
          name: config.name,
          type: "static",
          staticSourceName: config.staticSourceName,
          description: config.description,
          data: config.data as Prisma.JsonValue,
          active: true,
          updatedAt: new Date(),
        },
        create: {
          id: config.id,
          name: config.name,
          type: "static",
          staticSourceName: config.staticSourceName,
          description: config.description,
          data: config.data as Prisma.JsonValue,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    console.log("Static lookup sources seeded.");
  }

  async getData(sourceId: string, options: LookupOptions = {}): Promise<any[]> {
    const { search = "", limit = 50, offset = 0 } = options;

    console.log(`LookupService.getData called with:`, { sourceId, search, limit, offset });

    try {
      const lookupSource = await prisma.lookupSource.findUnique({
        where: { id: sourceId },
        include: { sourceModule: true, sourceForm: true },
      });

      if (!lookupSource) {
        console.log(`No lookup source found for ID: ${sourceId}`);
        return [];
      }

      if (lookupSource.type === "static") {
        console.log(`Using static data for source: ${lookupSource.staticSourceName}`);
        let data = (lookupSource.data as any[]) || [];

        if (search) {
          const searchLower = search.toLowerCase();
          data = data.filter((item) =>
            Object.values(item).some((value) => value != null && String(value).toLowerCase().includes(searchLower))
          );
        }

        const result = data.slice(offset, offset + limit).map((item) => ({
          record_id: item.id || String(Math.random()),
          ...item,
          type: item.type || "text",
        }));
        console.log(`Returning ${result.length} static records`);
        return result;
      }

      if (lookupSource.type === "form" && lookupSource.sourceFormId) {
        const form = await prisma.form.findUnique({
          where: { id: lookupSource.sourceFormId },
          include: {
            records: {
              take: limit,
              skip: offset,
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (form) {
          console.log(`Found form: ${form.name} with ${form.records.length} records`);
          const records = form.records.map((record) => {
            const recordData = record.recordData as any;
            const transformedData: any = {
              record_id: record.id,
              form_id: form.id,
              _recordId: record.id,
              _formId: form.id,
              _formName: form.name,
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
            };

            Object.entries(recordData).forEach(([key, value]: [string, any]) => {
              const fieldType = value?.type || "text";
              let fieldValue = value?.value;

              if (fieldType === "number" && fieldValue != null) {
                fieldValue = Number(fieldValue);
                if (isNaN(fieldValue)) fieldValue = value.value;
              } else if (fieldType === "datetime" && fieldValue) {
                try {
                  fieldValue = new Date(fieldValue).toISOString();
                } catch {
                  fieldValue = value.value;
                }
              } else if (fieldType === "date" && fieldValue) {
                try {
                  fieldValue = new Date(fieldValue).toISOString().split("T")[0];
                } catch {
                  fieldValue = value.value;
                }
              } else if (fieldType === "checkbox") {
                fieldValue = Boolean(fieldValue);
              } else if (fieldType === "tel" || fieldType === "email" || fieldType === "url") {
                fieldValue = String(fieldValue);
              }

              let parsedOptions: any = null;
              let parsedValidation: any = null;
              if (value?.options != null) {
                try {
                  parsedOptions = typeof value.options === "string" ? JSON.parse(value.options) : value.options;
                } catch {
                  parsedOptions = [];
                }
              }
              if (value?.validation != null) {
                try {
                  parsedValidation = typeof value.validation === "string" ? JSON.parse(value.validation) : value.validation;
                } catch {
                  parsedValidation = {};
                }
              }

              transformedData[key] = {
                field_id: value?.fieldId || key,
                field_value: fieldValue,
                field_label: value?.label || key,
                field_type: fieldType,
                field_section_id: value?.sectionId || null,
                field_options: parsedOptions,
                field_validation: parsedValidation,
              };
            });

            if (search) {
              const searchLower = search.toLowerCase();
              const matchesSearch = Object.values(transformedData).some((field: any) =>
                field.field_value != null && typeof field.field_value === "string"
                  ? field.field_value.toLowerCase().includes(searchLower)
                  : false
              );
              return matchesSearch ? transformedData : null;
            }
            return transformedData;
          });

          const filteredRecords = records.filter((record): record is NonNullable<typeof record> => record !== null);
          console.log(`Processed ${filteredRecords.length} form records`);
          return filteredRecords;
        }
      }

      if (lookupSource.type === "module" && lookupSource.sourceModuleId) {
        const module = await prisma.formModule.findUnique({
          where: { id: lookupSource.sourceModuleId },
          include: {
            forms: {
              include: {
                records: {
                  take: Math.floor(limit / 10),
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        });

        if (module) {
          console.log(`Found module: ${module.name} with ${module.forms.length} forms`);
          const records: any[] = [];

          module.forms.forEach((form) => {
            form.records.forEach((record) => {
              const recordData = record.recordData as any;
              const transformedData: any = {
                record_id: record.id,
                form_id: form.id,
                _recordId: record.id,
                _formId: form.id,
                _formName: form.name,
                _moduleId: module.id,
                _moduleName: module.name,
                createdAt: record.createdAt.toISOString(),
                updatedAt: record.updatedAt.toISOString(),
              };

              Object.entries(recordData).forEach(([key, value]: [string, any]) => {
                const fieldType = value?.type || "text";
                let fieldValue = value?.value;

                if (fieldType === "number" && fieldValue != null) {
                  fieldValue = Number(fieldValue);
                  if (isNaN(fieldValue)) fieldValue = value.value;
                } else if (fieldType === "datetime" && fieldValue) {
                  try {
                    fieldValue = new Date(fieldValue).toISOString();
                  } catch {
                    fieldValue = value.value;
                  }
                } else if (fieldType === "date" && fieldValue) {
                  try {
                    fieldValue = new Date(fieldValue).toISOString().split("T")[0];
                  } catch {
                    fieldValue = value.value;
                  }
                } else if (fieldType === "checkbox") {
                  fieldValue = Boolean(fieldValue);
                } else if (fieldType === "tel" || fieldType === "email" || fieldType === "url") {
                  fieldValue = String(fieldValue);
                }

                let parsedOptions: any = null;
                let parsedValidation: any = null;
                if (value?.options != null) {
                  try {
                    parsedOptions = typeof value.options === "string" ? JSON.parse(value.options) : value.options;
                  } catch {
                    parsedOptions = [];
                  }
                }
                if (value?.validation != null) {
                  try {
                    parsedValidation = typeof value.validation === "string" ? JSON.parse(value.validation) : value.validation;
                  } catch {
                    parsedValidation = {};
                  }
                }

                transformedData[key] = {
                  field_id: value?.fieldId || key,
                  field_value: fieldValue,
                  field_label: value?.label || key,
                  field_type: fieldType,
                  field_section_id: value?.sectionId || null,
                  field_options: parsedOptions,
                  field_validation: parsedValidation,
                };
              });

              if (search) {
                const searchLower = search.toLowerCase();
                const matchesSearch = Object.values(transformedData).some((field: any) =>
                  field.field_value != null && typeof field.field_value === "string"
                    ? field.field_value.toLowerCase().includes(searchLower)
                    : false
                );
                if (matchesSearch) records.push(transformedData);
              } else {
                records.push(transformedData);
              }
            });
          });

          console.log(`Processed ${records.length} module records`);
          return records.slice(0, limit);
        }
      }

      console.log(`No data found for source: ${sourceId}`);
      return [];
    } catch (error: any) {
      console.log("Error in LookupService.getData:", { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getFields(sourceId: string): Promise<string[]> {
    console.log(`LookupService.getFields called for source: ${sourceId}`);

    try {
      const lookupSource = await prisma.lookupSource.findUnique({
        where: { id: sourceId },
        include: { sourceForm: { include: { records: { take: 1, orderBy: { createdAt: "desc" } } } }, sourceModule: true },
      });

      if (!lookupSource) {
        console.log(`No lookup source found for ID: ${sourceId}`);
        return [];
      }

      if (lookupSource.type === "static") {
        const data = (lookupSource.data as any[]) || [];
        const sampleData = data[0];
        if (sampleData) {
          const fields = Object.keys(sampleData);
          console.log(`Static source ${sourceId} fields:`, fields);
          return fields;
        }
        return [];
      }

      if (lookupSource.type === "form" && lookupSource.sourceForm) {
        const form = lookupSource.sourceForm;
        const fields = new Set<string>();

        if (form.records.length > 0) {
          const recordData = form.records[0].recordData as any;
          if (recordData && typeof recordData === "object") {
            Object.entries(recordData).forEach(([key, value]: [string, any]) => {
              const fieldLabel = value?.label || key;
              fields.add(fieldLabel);
            });
          }
        }

        fields.add("id");
        fields.add("name");
        fields.add("title");
        fields.add("description");
        fields.add("createdAt");
        fields.add("updatedAt");

        const fieldArray = Array.from(fields);
        console.log(`Form ${sourceId} fields:`, fieldArray);
        return fieldArray;
      }

      if (lookupSource.type === "module" && lookupSource.sourceModuleId) {
        const module = await prisma.formModule.findUnique({
          where: { id: lookupSource.sourceModuleId },
          include: {
            forms: {
              include: {
                records: {
                  take: 1,
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        });

        if (module) {
          const fields = new Set<string>();
          module.forms.forEach((form) => {
            if (form.records.length > 0) {
              const recordData = form.records[0].recordData as any;
              if (recordData && typeof recordData === "object") {
                Object.entries(recordData).forEach(([key, value]: [string, any]) => {
                  const fieldLabel = value?.label || key;
                  fields.add(fieldLabel);
                });
              }
            }
          });

          fields.add("id");
          fields.add("name");
          fields.add("title");
          fields.add("description");
          fields.add("createdAt");
          fields.add("updatedAt");

          const fieldArray = Array.from(fields);
          console.log(`Module ${sourceId} fields:`, fieldArray);
          return fieldArray;
        }
      }

      console.log(`No fields found for source: ${sourceId}`);
      return [];
    } catch (error) {
      console.error("Error in LookupService.getFields:", error);
      throw error;
    }
  }

  static async getLookupSources(): Promise<LookupSourceData[]> {
    try {
      const sources: LookupSourceData[] = [];

      const staticSources = await prisma.lookupSource.findMany({
        where: { type: "static", active: true },
      });

      sources.push(
        ...staticSources.map((source) => ({
          id: source.id,
          name: source.name,
          description: source.description,
          type: source.type,
          recordCount: (source.data as any[])?.length || 0,
          icon: source.staticSourceName === "countries" ? "🌍" :
                source.staticSourceName === "currencies" ? "💰" :
                source.staticSourceName === "priorities" ? "⚡" :
                source.staticSourceName === "statuses" ? "🔄" :
                source.staticSourceName === "departments" ? "🏢" : "📋",
        }))
      );

      const modules = await prisma.formModule.findMany({
        include: {
          forms: {
            include: {
              _count: {
                select: { records: true },
              },
            },
          },
        },
      });

      for (const module of modules) {
        const totalRecords = module.forms.reduce((sum: number, form: any) => sum + form._count.records, 0);

        const moduleSource = await prisma.lookupSource.upsert({
          where: { id: `module_${module.id}` },
          update: {
            name: module.name,
            type: "module",
            description: module.description,
            active: true,
            updatedAt: new Date(),
          },
          create: {
            id: `module_${module.id}`,
            name: module.name,
            type: "module",
            sourceModuleId: module.id,
            description: module.description,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        sources.push({
          id: moduleSource.id,
          name: moduleSource.name,
          description: moduleSource.description,
          type: moduleSource.type,
          recordCount: totalRecords,
          icon: "📁",
        });

        for (const form of module.forms) {
          const formSource = await prisma.lookupSource.upsert({
            where: { id: `form_${form.id}` },
            update: {
              name: `${form.name} (${module.name})`,
              type: "form",
              description: `Records from ${form.name} form in ${module.name} module`,
              active: true,
              updatedAt: new Date(),
            },
            create: {
              id: `form_${form.id}`,
              name: `${form.name} (${module.name})`,
              type: "form",
              sourceFormId: form.id,
              description: `Records from ${form.name} form in ${module.name} module`,
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          sources.push({
            id: formSource.id,
            name: formSource.name,
            description: formSource.description,
            type: formSource.type,
            recordCount: form._count.records,
            icon: "📄",
          });
        }
      }

      return sources;
    } catch (error) {
      console.error("Error fetching lookup sources:", error);
      return [];
    }
  }
}