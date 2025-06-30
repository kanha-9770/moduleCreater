import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface LookupSource {
  id: string;
  name: string;
  description?: string;
  type: "form" | "module" | "static";
  icon?: string;
  recordCount?: number;
  config?: any;
}

export interface LookupOption {
  id: string;
  label: string;
  value: string;
  storeValue: any;
  description?: string;
  data?: any;
}

export interface FieldMapping {
  display: string;
  value: string;
  store: string;
  description?: string;
}

interface LookupFieldConfig {
  key: string;
  type: string;
  config?: {
    lookupSource?: string;
  };
}

export class LookupService {
  // New method to create cross-form records for lookup fields
  static async createCrossFormRecords(formId: string, recordData: any, submittedBy: string | null): Promise<void> {
    try {
      console.log(`Creating cross-form records for form: ${formId}`);

      // Fetch the form to get its configuration
      const form = await prisma.form.findUnique({
        where: { id: formId },
        select: {
          id: true,
          settings: true, // Assuming lookup field config is stored in settings
        },
      });

      if (!form) {
        console.warn(`Form not found: ${formId}`);
        return;
      }

      // Extract lookup fields from settings (assuming settings contains a fields array)
      const settings = form.settings as { fields?: LookupFieldConfig[] } | null;
      const lookupFields: LookupFieldConfig[] =
        settings?.fields?.filter((field) => field.type === "lookup" && field.config?.lookupSource) || [];

      if (!lookupFields.length) {
        console.log(`No lookup fields found for form: ${formId}`);
        return;
      }

      // Process each lookup field
      for (const field of lookupFields) {
        const lookupSourceId = field.config?.lookupSource;
        const fieldKey = field.key;

        if (!lookupSourceId) {
          console.log(`Skipping lookup field ${fieldKey}: no source provided`);
          continue;
        }

        const value = recordData[fieldKey];
        if (!value) {
          console.log(`Skipping lookup field ${fieldKey}: no value provided`);
          continue;
        }

        // Handle form-based lookup sources
        if (lookupSourceId.startsWith("form_")) {
          const targetFormId = lookupSourceId.replace("form_", "");

          // Create a cross-reference record in the target form
          await prisma.formRecord.create({
            data: {
              formId: targetFormId,
              recordData: {
                [fieldKey]: value, // Store the lookup value
                sourceFormId: formId, // Reference the source form
                sourceRecordId: recordData.id || null, // Reference the source record (if available)
              },
              submittedBy: submittedBy || "anonymous",
              submittedAt: new Date(),
            },
          });

          console.log(`Created cross-form record for field ${fieldKey} in form ${targetFormId}`);
        }
      }
    } catch (error) {
      console.error("Error creating cross-form records:", error);
      throw error; // Let the caller handle the error
    }
  }

  static async getLookupSources(): Promise<LookupSource[]> {
    try {
      const sources: LookupSource[] = [];

      // Get modules with their forms as potential lookup sources
      const modules = await prisma.formModule.findMany({
        include: {
          forms: {
            include: {
              _count: {
                select: {
                  records: true,
                },
              },
            },
          },
        },
      });

      // Add modules as sources (for backward compatibility)
      for (const module of modules) {
        const totalRecords = module.forms.reduce((sum, form) => sum + form._count.records, 0);

        sources.push({
          id: module.id,
          name: module.name,
          description: module.description || `Module with ${module.forms.length} forms`,
          type: "module",
          recordCount: totalRecords,
          icon: "📁",
        });

        // Add individual forms as lookup sources
        for (const form of module.forms) {
          sources.push({
            id: `form_${form.id}`,
            name: `${form.name} (${module.name})`,
            description: `Records from ${form.name} form in ${module.name} module`,
            type: "form",
            recordCount: form._count.records,
            icon: "📄",
          });
        }
      }

      // Add comprehensive built-in static sources
      sources.push(
        {
          id: "countries",
          name: "Countries",
          description: "World countries with codes and regions",
          type: "static",
          recordCount: 195,
          icon: "🌍",
        },
        {
          id: "currencies",
          name: "Currencies",
          description: "World currencies with symbols",
          type: "static",
          recordCount: 168,
          icon: "💰",
        },
        {
          id: "timezones",
          name: "Time Zones",
          description: "World time zones with offsets",
          type: "static",
          recordCount: 424,
          icon: "🕐",
        },
        {
          id: "languages",
          name: "Languages",
          description: "Programming and spoken languages",
          type: "static",
          recordCount: 150,
          icon: "🗣️",
        },
        {
          id: "departments",
          name: "Departments",
          description: "Common company departments",
          type: "static",
          recordCount: 25,
          icon: "🏢",
        },
        {
          id: "job_titles",
          name: "Job Titles",
          description: "Common job titles and positions",
          type: "static",
          recordCount: 100,
          icon: "💼",
        },
        {
          id: "industries",
          name: "Industries",
          description: "Business industry categories",
          type: "static",
          recordCount: 50,
          icon: "🏭",
        },
        {
          id: "skills",
          name: "Skills",
          description: "Technical and soft skills",
          type: "static",
          recordCount: 200,
          icon: "🎯",
        },
        {
          id: "education_levels",
          name: "Education Levels",
          description: "Academic qualification levels",
          type: "static",
          recordCount: 15,
          icon: "🎓",
        },
        {
          id: "company_sizes",
          name: "Company Sizes",
          description: "Employee count ranges",
          type: "static",
          recordCount: 8,
          icon: "📊",
        },
        {
          id: "priorities",
          name: "Priorities",
          description: "Task and project priorities",
          type: "static",
          recordCount: 5,
          icon: "⚡",
        },
        {
          id: "statuses",
          name: "Status Options",
          description: "Common status values",
          type: "static",
          recordCount: 10,
          icon: "🔄",
        }
      );

      return sources;
    } catch (error) {
      console.error("Error fetching lookup sources:", error);
      return [];
    }
  }

  static async getSourceFields(sourceId: string): Promise<string[]> {
    try {
      console.log("Getting source fields for:", sourceId);

      // Handle static sources
      if (this.isStaticSource(sourceId)) {
        return this.getStaticSourceFields(sourceId);
      }

      // Handle form-specific lookups
      if (sourceId.startsWith("form_")) {
        const formId = sourceId.replace("form_", "");
        return this.getFormSourceFields(formId);
      }

      // Handle module sources
      return this.getModuleSourceFields(sourceId);
    } catch (error) {
      console.error("Error fetching source fields:", error);
      return ["id", "name", "title", "label", "description", "email"];
    }
  }

  static async getLookupOptions(
    sourceId: string,
    fieldMapping: FieldMapping,
    searchTerm?: string
  ): Promise<LookupOption[]> {
    try {
      console.log("Getting lookup options for source:", sourceId, "with mapping:", fieldMapping);

      // Handle static sources
      if (this.isStaticSource(sourceId)) {
        return this.getStaticLookupOptions(sourceId, fieldMapping, searchTerm);
      }

      // Handle form-specific lookups
      if (sourceId.startsWith("form_")) {
        const formId = sourceId.replace("form_", "");
        return this.getFormLookupOptions(formId, fieldMapping, searchTerm);
      }

      // Handle module sources (all forms in module)
      return this.getModuleLookupOptions(sourceId, fieldMapping, searchTerm);
    } catch (error) {
      console.error("Error fetching lookup options:", error);
      return [];
    }
  }

  // Enhanced field value extraction with better fallback logic
  private static extractFieldValue(recordData: any, fieldPath: string): any {
    if (!recordData || !fieldPath) return null;

    // Handle system fields
    if (fieldPath === "id" && recordData.id) return recordData.id;
    if (fieldPath === "createdAt" && recordData.createdAt) return recordData.createdAt;
    if (fieldPath === "updatedAt" && recordData.updatedAt) return recordData.updatedAt;

    // Handle nested field paths (e.g., "user.name")
    const parts = fieldPath.split(".");
    let value = recordData;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        // Try case-insensitive matching
        const keys = Object.keys(value || {});
        const matchingKey = keys.find((key) => key.toLowerCase() === part.toLowerCase());
        if (matchingKey) {
          value = value[matchingKey];
        } else {
          return null;
        }
      }
    }

    // Clean up the value
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);

    return String(value);
  }

  // Get lookup options from a specific form with enhanced field mapping
  private static async getFormLookupOptions(formId: string, fieldMapping: FieldMapping, searchTerm = "") {
    try {
      const form = await prisma.form.findUnique({
        where: { id: formId },
        include: {
          records: {
            take: 100, // Limit for performance
            orderBy: { submittedAt: "desc" },
          },
          module: true,
        },
      });

      if (!form) {
        console.log("Form not found:", formId);
        return [];
      }

      console.log(`Processing starting akash ${form.records.length} records from form: ${form.name}`);

      const options: LookupOption[] = [];
      const mapping = fieldMapping || { display: "name", value: "id", store: "name" };

      for (const record of form.records) {
        const recordData = record.recordData as any;

        if (!recordData || typeof recordData !== "object") {
          console.log("Skipping invalid record data:", record.id);
          continue;
        }

        // Extract values using enhanced field extraction
        const displayValue = this.extractFieldValue(recordData, mapping.display);
        const valueField = this.extractFieldValue(recordData, mapping.value) || record.id;
        const storeValue = this.extractFieldValue(recordData, mapping.store) || displayValue;
        const descriptionValue = mapping.description ? this.extractFieldValue(recordData, mapping.description) : null;

        // Create option with fallback display value
        const option: LookupOption = {
          id: record.id,
          label: displayValue || `Record Not Exists ${record.id.slice(-8)}`,
          value: String(valueField),
          storeValue: storeValue || displayValue,
          description: descriptionValue || `From ${form.name}`,
          data: recordData,
        };

        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            option.label?.toLowerCase().includes(searchLower) ||
            option.description?.toLowerCase().includes(searchLower) ||
            String(option.storeValue)?.toLowerCase().includes(searchLower);

          if (matchesSearch) {
            options.push(option);
          }
        } else {
          options.push(option);
        }
      }

      console.log(`Generated ${options.length} lookup options from form`);
      return options;
    } catch (error) {
      console.error("Error fetching form lookup options:", error);
      return [];
    }
  }

  // Get lookup options from all forms in a module
  private static async getModuleLookupOptions(moduleId: string, fieldMapping: FieldMapping, searchTerm = "") {
    try {
      const module = await prisma.formModule.findUnique({
        where: { id: moduleId },
        include: {
          forms: {
            include: {
              records: {
                take: 50, // Limit per form for performance
                orderBy: { submittedAt: "desc" },
              },
            },
          },
        },
      });

      if (!module) {
        console.log("Module not found:", moduleId);
        return [];
      }

      const options: LookupOption[] = [];
      const mapping = fieldMapping || { display: "name", value: "id", store: "name" };

      // Get records from all forms in the module
      for (const form of module.forms) {
        for (const record of form.records) {
          const recordData = record.recordData as any;

          if (!recordData || typeof recordData !== "object") continue;

          // Extract values using enhanced field extraction
          const displayValue = this.extractFieldValue(recordData, mapping.display);
          const valueField = this.extractFieldValue(recordData, mapping.value) || record.id;
          const storeValue = this.extractFieldValue(recordData, mapping.store) || displayValue;
         

 const descriptionValue = mapping.description ? this.extractFieldValue(recordData, mapping.description) : null;

          const option: LookupOption = {
            id: record.id,
            label: displayValue || `Record ${record.id.slice(-8)}`,
            value: String(valueField),
            storeValue: storeValue || displayValue,
            description: descriptionValue || `From ${form.name}`,
            data: recordData,
          };

          // Apply search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
              option.label?.toLowerCase().includes(searchLower) ||
              option.description?.toLowerCase().includes(searchLower) ||
              String(option.storeValue)?.toLowerCase().includes(searchLower);

            if (matchesSearch) {
              options.push(option);
            }
          } else {
            options.push(option);
          }
        }
      }

      console.log(`Generated ${options.length} lookup options from module`);
      return options;
    } catch (error) {
      console.error("Error fetching module lookup options:", error);
      return [];
    }
  }

  // Get available fields for form sources with comprehensive field discovery
  private static async getFormSourceFields(formId: string): Promise<string[]> {
    try {
      const form = await prisma.form.findUnique({
        where: { id: formId },
        include: {
          records: {
            take: 5, // Sample multiple records to get comprehensive field list
            orderBy: { submittedAt: "desc" },
          },
        },
      });

      if (!form || !form.records.length) {
        return ["id", "name", "title", "label", "description", "email", "createdAt", "updatedAt"];
      }

      const allFields = new Set<string>();

      // Add system fields
      allFields.add("id");
      allFields.add("createdAt");
      allFields.add("updatedAt");

      // Collect fields from all sample records
      for (const record of form.records) {
        const recordData = record.recordData as any;
        if (recordData && typeof recordData === "object") {
          this.collectFieldsRecursively(recordData, "", allFields);
        }
      }

      // Add common field names that might not be in sample data
      const commonFields = ["name", "title", "label", "description", "email", "phone", "address", "company", "status"];
      commonFields.forEach((field) => allFields.add(field));

      const fieldArray = Array.from(allFields).sort();
      console.log(`Found ${fieldArray.length} fields for form ${formId}:`, fieldArray);

      return fieldArray;
    } catch (error) {
      console.error("Error fetching form source fields:", error);
      return ["id", "name", "title", "label", "description", "email"];
    }
  }

  // Recursively collect field names from nested objects
  private static collectFieldsRecursively(obj: any, prefix: string, fields: Set<string>) {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;

      // Add the field name
      fields.add(fieldName);

      // If it's a nested object (but not an array), recurse
      if (value && typeof value === "object" && !Array.isArray(value)) {
        this.collectFieldsRecursively(value, fieldName, fields);
      }
    }
  }

  // Get available fields for module sources
  private static async getModuleSourceFields(moduleId: string): Promise<string[]> {
    try {
      const module = await prisma.formModule.findUnique({
        where: { id: moduleId },
        include: {
          forms: {
            include: {
              records: {
                take: 2, // Sample records from each form
                orderBy: { submittedAt: "desc" },
              },
            },
          },
        },
      });

      if (!module) {
        return ["id", "name", "title", "label", "description", "email"];
      }

      const allFields = new Set<string>();

      // Add system fields
      allFields.add("id");
      allFields.add("createdAt");
      allFields.add("updatedAt");

      // Collect fields from all forms in the module
      for (const form of module.forms) {
        for (const record of form.records) {
          const recordData = record.recordData as any;
          if (recordData && typeof recordData === "object") {
            this.collectFieldsRecursively(recordData, "", allFields);
          }
        }
      }

      // Add common fields
      const commonFields = ["name", "title", "label", "description", "email", "phone", "address", "company", "status"];
      commonFields.forEach((field) => allFields.add(field));

      return Array.from(allFields).sort();
    } catch (error) {
      console.error("Error fetching module source fields:", error);
      return ["id", "name", "title", "label", "description", "email"];
    }
  }

  // Get available fields for static sources
  private static getStaticSourceFields(sourceId: string): string[] {
    const staticFieldMappings: Record<string, string[]> = {
      countries: ["id", "name", "label", "code", "region"],
      currencies: ["id", "name", "label", "code", "symbol"],
      timezones: ["id", "name", "label", "offset"],
      languages: ["id", "name", "label", "type"],
      departments: ["id", "name", "label", "category"],
      job_titles: ["id", "name", "label", "level"],
      industries: ["id", "name", "label", "sector"],
      skills: ["id", "name", "label", "category", "type"],
      education_levels: ["id", "name", "label", "level"],
      company_sizes: ["id", "name", "label", "min", "max"],
      priorities: ["id", "name", "label", "level", "color"],
      statuses: ["id", "name", "label", "color"],
    };

    return staticFieldMappings[sourceId] || ["id", "name", "label", "value"];
  }

  // Check if source is static
  private static isStaticSource(sourceId: string): boolean {
    const staticSources = [
      "countries",
      "currencies",
      "timezones",
      "languages",
      "departments",
      "job_titles",
      "industries",
      "skills",
      "education_levels",
      "company_sizes",
      "priorities",
      "statuses",
    ];

    return staticSources.includes(sourceId);
  }

  // Get static lookup options with field mapping
  private static getStaticLookupOptions(sourceId: string, fieldMapping: FieldMapping, searchTerm = "") {
    const mapping = fieldMapping || { display: "name", value: "id", store: "name" };

    const staticData: Record<string, any[]> = {
      countries: [
        { id: "us", name: "United States", label: "United States", value: "us", code: "US", region: "North America" },
        { id: "ca", name: "Canada", label: "Canada", value: "ca", code: "CA", region: "North America" },
        { id: "uk", name: "United Kingdom", label: "United Kingdom", value: "uk", code: "GB", region: "Europe" },
        { id: "de", name: "Germany", label: "Germany", value: "de", code: "DE", region: "Europe" },
        { id: "fr", name: "France", label: "France", value: "fr", code: "FR", region: "Europe" },
        { id: "jp", name: "Japan", label: "Japan", value: "jp", code: "JP", region: "Asia" },
        { id: "au", name: "Australia", label: "Australia", value: "au", code: "AU", region: "Oceania" },
        { id: "in", name: "India", label: "India", value: "in", code: "IN", region: "Asia" },
        { id: "br", name: "Brazil", label: "Brazil", value: "br", code: "BR", region: "South America" },
        { id: "mx", name: "Mexico", label: "Mexico", value: "mx", code: "MX", region: "North America" },
        { id: "cn", name: "China", label: "China", value: "cn", code: "CN", region: "Asia" },
        { id: "ru", name: "Russia", label: "Russia", value: "ru", code: "RU", region: "Europe/Asia" },
        { id: "za", name: "South Africa", label: "South Africa", value: "za", code: "ZA", region: "Africa" },
        { id: "eg", name: "Egypt", label: "Egypt", value: "eg", code: "EG", region: "Africa" },
        { id: "ng", name: "Nigeria", label: "Nigeria", value: "ng", code: "NG", region: "Africa" },
      ],
      currencies: [
        { id: "usd", name: "US Dollar", label: "US Dollar (USD)", value: "usd", code: "USD", symbol: "$" },
        { id: "eur", name: "Euro", label: "Euro (EUR)", value: "eur", code: "EUR", symbol: "€" },
        { id: "gbp", name: "British Pound", label: "British Pound (GBP)", value: "gbp", code: "GBP", symbol: "£" },
        { id: "jpy", name: "Japanese Yen", label: "Japanese Yen (JPY)", value: "jpy", code: "JPY", symbol: "¥" },
        { id: "cad", name: "Canadian Dollar", label: "Canadian Dollar (CAD)", value: "cad", code: "CAD", symbol: "C$" },
        {
          id: "aud",
          name: "Australian Dollar",
          label: "Australian Dollar (AUD)",
          value: "aud",
          code: "AUD",
          symbol: "A$",
        },
        { id: "chf", name: "Swiss Franc", label: "Swiss Franc (CHF)", value: "chf", code: "CHF", symbol: "CHF" },
        { id: "cny", name: "Chinese Yuan", label: "Chinese Yuan (CNY)", value: "cny", code: "CNY", symbol: "¥" },
        { id: "inr", name: "Indian Rupee", label: "Indian Rupee (INR)", value: "inr", code: "INR", symbol: "₹" },
        { id: "brl", name: "Brazilian Real", label: "Brazilian Real (BRL)", value: "brl", code: "BRL", symbol: "R$" },
      ],
      priorities: [
        { id: "critical", name: "Critical", label: "Critical", value: "critical", level: 5, color: "#dc2626" },
        { id: "high", name: "High", label: "High", value: "high", level: 4, color: "#ea580c" },
        { id: "medium", name: "Medium", label: "Medium", value: "medium", level: 3, color: "#ca8a04" },
        { id: "low", name: "Low", label: "Low", value: "low", level: 2, color: "#16a34a" },
        { id: "minimal", name: "Minimal", label: "Minimal", value: "minimal", level: 1, color: "#6b7280" },
      ],
      statuses: [
        { id: "active", name: "Active", label: "Active", value: "active", color: "#16a34a" },
        { id: "inactive", name: "Inactive", label: "Inactive", value: "inactive", color: "#6b7280" },
        { id: "pending", name: "Pending", label: "Pending", value: "pending", color: "#ca8a04" },
        { id: "approved", name: "Approved", label: "Approved", value: "approved", color: "#16a34a" },
        { id: "rejected", name: "Rejected", label: "Rejected", value: "rejected", color: "#dc2626" },
        { id: "draft", name: "Draft", label: "Draft", value: "draft", color: "#6b7280" },
        { id: "published", name: "Published", label: "Published", value: "published", color: "#2563eb" },
        { id: "archived", name: "Archived", label: "Archived", value: "archived", color: "#6b7280" },
        { id: "in_progress", name: "In Progress", label: "In Progress", value: "in_progress", color: "#2563eb" },
        { id: "completed", name: "Completed", label: "Completed", value: "completed", color: "#16a34a" },
      ],
    };

    const data = staticData[sourceId] || [];

    // Transform data using field mapping
    const transformedData = data.map((item) => ({
      id: this.extractFieldValue(item, mapping.value) || item.id,
      label: this.extractFieldValue(item, mapping.display) || item.name,
      value: this.extractFieldValue(item, mapping.value) || item.id,
      storeValue: this.extractFieldValue(item, mapping.store) || this.extractFieldValue(item, mapping.display),
      description: mapping.description ? this.extractFieldValue(item, mapping.description) : undefined,
      data: item,
    }));

    if (!searchTerm) {
      return transformedData;
    }

    const searchLower = searchTerm.toLowerCase();
    return transformedData.filter(
      (item) =>
        item.label?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        String(item.storeValue)?.toLowerCase().includes(searchLower)
    );
  }
}