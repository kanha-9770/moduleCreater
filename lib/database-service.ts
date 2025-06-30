import { prisma } from "./prisma"
import type { FormModule, Form, FormSection, FormField, FormRecord, FormEvent, FieldType } from "@/types/form-builder"

export class DatabaseService {
  // Module operations
  static async createModule(data: { name: string; description?: string }): Promise<FormModule> {
    if (!data.name || data.name.trim() === "") {
      throw new Error("Module name is required")
    }

    try {
      const module = await prisma.formModule.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          settings: {},
        },
        include: {
          forms: {
            include: {
              sections: {
                include: {
                  fields: true,
                  subforms: {
                    include: {
                      fields: true,
                      records: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      })

      // Create a default form for the module
      const defaultForm = await this.createForm({
        moduleId: module.id,
        name: "Default Form",
        description: "Your first form in this module",
      })

      return {
        ...module,
        forms: [defaultForm],
        settings: (module.settings || {}) as Record<string, any>,
      }
    } catch (error: any) {
      console.error("Database error creating module:", error)
      throw new Error(`Failed to create module: ${error?.message}`)
    }
  }

  static async getModules(): Promise<FormModule[]> {
    try {
      const modules = await prisma.formModule.findMany({
        include: {
          forms: {
            include: {
              sections: {
                include: {
                  fields: true,
                  subforms: {
                    include: {
                      fields: true,
                      records: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
              records: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return modules.map((module) => ({
        ...module,
        settings: (module.settings || {}) as Record<string, any>,
        forms: module.forms.map((form) => ({
          ...form,
          settings: (form.settings || {}) as Record<string, any>,
          conditional: null,
          styling: null,
          sections: form.sections.map((s) => ({
            ...s,
            conditional: (s.conditional || null) as Record<string, any> | null,
            styling: (s.styling || null) as Record<string, any> | null,
            fields: s.fields.map((f) => ({
              ...f,
              options: (f.options || []) as any[],
              validation: (f.validation || {}) as Record<string, any>,
              conditional: (f.conditional || null) as Record<string, any> | null,
              styling: (f.styling || null) as Record<string, any> | null,
              properties: (f.properties || null) as Record<string, any> | null,
              rollup: (f.rollup || null) as Record<string, any> | null,
              lookup: (f.lookup || null) as any,
              width: (f.width as "full" | "half" | "third" | "quarter") || "full",
              sourceModule: (f as any).sourceModule,
              sourceForm: (f as any).sourceForm,
              displayField: (f as any).displayField,
              valueField: (f as any).valueField,
              multiple: (f as any).multiple,
              searchable: (f as any).searchable,
              filters: (f as any).filters,
            })),
            subforms: s.subforms.map((sf) => ({
              ...sf,
              fields: sf.fields.map((f) => ({
                ...f,
                options: (f.options || []) as any[],
                validation: (f.validation || {}) as Record<string, any>,
                conditional: (f.conditional || null) as Record<string, any> | null,
                styling: (f.styling || null) as Record<string, any> | null,
                properties: (f.properties || null) as Record<string, any> | null,
                rollup: (f.rollup || null) as Record<string, any> | null,
                lookup: (f.lookup || null) as any,
                width: (f.width as "full" | "half" | "third" | "quarter") || "full",
                sourceModule: (f as any).sourceModule,
                sourceForm: (f as any).sourceForm,
                displayField: (f as any).displayField,
                valueField: (f as any).valueField,
                multiple: (f as any).multiple,
                searchable: (f as any).searchable,
                filters: (f as any).filters,
              })),
              records: sf.records.map((r) => ({
                ...r,
                recordData: (r.data || {}) as Record<string, any>,
              })),
            })),
          })),
          recordCount: form.records.length,
          records: form.records.map((r) => ({
            ...r,
            recordData: (r.recordData || {}) as Record<string, any>,
            ipAddress: r.ipAddress || undefined,
            userAgent: r.userAgent || undefined,
            createdAt: r.updatedAt,
            updatedAt: r.updatedAt,
          })),
        })),
      }))
    } catch (error: any) {
      console.error("Database error fetching modules:", error)
      throw new Error(`Failed to fetch modules: ${error?.message}`)
    }
  }

  static async getModule(id: string): Promise<FormModule | null> {
    try {
      const module = await prisma.formModule.findUnique({
        where: { id },
        include: {
          forms: {
            include: {
              sections: {
                include: {
                  fields: true,
                  subforms: {
                    include: {
                      fields: true,
                      records: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
              records: true,
            },
          },
        },
      })

      if (!module) return null

      return {
        ...module,
        settings: (module.settings || {}) as Record<string, any>,
        forms: module.forms.map((form) => ({
          ...form,
          settings: (form.settings || {}) as Record<string, any>,
          conditional: null,
          styling: null,
          sections: form.sections.map((s) => ({
            ...s,
            conditional: (s.conditional || null) as Record<string, any> | null,
            styling: (s.styling || null) as Record<string, any> | null,
            fields: s.fields.map((f) => ({
              ...f,
              options: (f.options || []) as any[],
              validation: (f.validation || {}) as Record<string, any>,
              conditional: (f.conditional || null) as Record<string, any> | null,
              styling: (f.styling || null) as Record<string, any> | null,
              properties: (f.properties || null) as Record<string, any> | null,
              rollup: (f.rollup || null) as Record<string, any> | null,
              lookup: (f.lookup || null) as any,
              width: (f.width as "full" | "half" | "third" | "quarter") || "full",
              sourceModule: (f as any).sourceModule,
              sourceForm: (f as any).sourceForm,
              displayField: (f as any).displayField,
              valueField: (f as any).valueField,
              multiple: (f as any).multiple,
              searchable: (f as any).searchable,
              filters: (f as any).filters,
            })),
            subforms: s.subforms.map((sf) => ({
              ...sf,
              fields: sf.fields.map((f) => ({
                ...f,
                options: (f.options || []) as any[],
                validation: (f.validation || {}) as Record<string, any>,
                conditional: (f.conditional || null) as Record<string, any> | null,
                styling: (f.styling || null) as Record<string, any> | null,
                properties: (f.properties || null) as Record<string, any> | null,
                rollup: (f.rollup || null) as Record<string, any> | null,
                lookup: (f.lookup || null) as any,
                width: (f.width as "full" | "half" | "third" | "quarter") || "full",
                sourceModule: (f as any).sourceModule,
                sourceForm: (f as any).sourceForm,
                displayField: (f as any).displayField,
                valueField: (f as any).valueField,
                multiple: (f as any).multiple,
                searchable: (f as any).searchable,
                filters: (f as any).filters,
              })),
              records: sf.records.map((r) => ({
                ...r,
                recordData: (r.data || {}) as Record<string, any>,
              })),
            })),
          })),
          recordCount: form.records.length,
          records: form.records.map((r) => ({
            ...r,
            recordData: (r.recordData || {}) as Record<string, any>,
            ipAddress: r.ipAddress || undefined,
            userAgent: r.userAgent || undefined,
            createdAt: r.updatedAt,
            updatedAt: r.updatedAt,
          })),
        })),
      }
    } catch (error: any) {
      console.error("Database error fetching module:", error)
      throw new Error(`Failed to fetch module: ${error?.message}`)
    }
  }

  static async updateModule(id: string, data: Partial<FormModule>): Promise<FormModule> {
    try {
      const module = await prisma.formModule.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          settings: data.settings,
        },
        include: {
          forms: {
            include: {
              sections: {
                include: {
                  fields: true,
                  subforms: {
                    include: {
                      fields: true,
                      records: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
              records: true,
            },
          },
        },
      })

      return {
        ...module,
        settings: (module.settings || {}) as Record<string, any>,
        forms: module.forms.map((form) => ({
          ...form,
          settings: (form.settings || {}) as Record<string, any>,
          conditional: null,
          styling: null,
          sections: form.sections.map((s) => ({
            ...s,
            conditional: (s.conditional || null) as Record<string, any> | null,
            styling: (s.styling || null) as Record<string, any> | null,
            fields: s.fields.map((f) => ({
              ...f,
              options: (f.options || []) as any[],
              validation: (f.validation || {}) as Record<string, any>,
              conditional: (f.conditional || null) as Record<string, any> | null,
              styling: (f.styling || null) as Record<string, any> | null,
              properties: (f.properties || null) as Record<string, any> | null,
              rollup: (f.rollup || null) as Record<string, any> | null,
              lookup: (f.lookup || null) as any,
              width: (f.width as "full" | "half" | "third" | "quarter") || "full",
              sourceModule: (f as any).sourceModule,
              sourceForm: (f as any).sourceForm,
              displayField: (f as any).displayField,
              valueField: (f as any).valueField,
              multiple: (f as any).multiple,
              searchable: (f as any).searchable,
              filters: (f as any).filters,
            })),
            subforms: s.subforms.map((sf) => ({
              ...sf,
              fields: sf.fields.map((f) => ({
                ...f,
                options: (f.options || []) as any[],
                validation: (f.validation || {}) as Record<string, any>,
                conditional: (f.conditional || null) as Record<string, any> | null,
                styling: (f.styling || null) as Record<string, any> | null,
                properties: (f.properties || null) as Record<string, any> | null,
                rollup: (f.rollup || null) as Record<string, any> | null,
                lookup: (f.lookup || null) as any,
                width: (f.width as "full" | "half" | "third" | "quarter") || "full",
                sourceModule: (f as any).sourceModule,
                sourceForm: (f as any).sourceForm,
                displayField: (f as any).displayField,
                valueField: (f as any).valueField,
                multiple: (f as any).multiple,
                searchable: (f as any).searchable,
                filters: (f as any).filters,
              })),
              records: sf.records.map((r) => ({
                ...r,
                recordData: (r.data || {}) as Record<string, any>,
              })),
            })),
          })),
          recordCount: form.records.length,
          records: form.records.map((r) => ({
            ...r,
            recordData: (r.recordData || {}) as Record<string, any>,
            ipAddress: r.ipAddress || undefined,
            userAgent: r.userAgent || undefined,
            createdAt: r.updatedAt,
            updatedAt: r.updatedAt,
          })),
        })),
      }
    } catch (error: any) {
      console.error("Database error updating module:", error)
      throw new Error(`Failed to update module: ${error?.message}`)
    }
  }

  static async deleteModule(id: string): Promise<void> {
    try {
      await prisma.formModule.delete({
        where: { id },
      })
    } catch (error: any) {
      console.error("Database error deleting module:", error)
      throw new Error(`Failed to delete module: ${error?.message}`)
    }
  }

  // Form operations
  static async createForm(data: { moduleId: string; name: string; description?: string }): Promise<Form> {
    try {
      const form = await prisma.form.create({
        data: {
          moduleId: data.moduleId,
          name: data.name,
          description: data.description,
          settings: {},
          isPublished: false,
          allowAnonymous: true,
          requireLogin: false,
          submissionMessage: "Thank you for your submission!",
        },
        include: {
          sections: {
            include: {
              fields: true,
              subforms: {
                include: {
                  fields: true,
                  records: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      })

      // Create a default section for the form
      const defaultSection = await this.createSection({
        formId: form.id,
        title: "Default Section",
        description: "Your first section",
        columns: 1,
        order: 0,
      })

      return {
        ...form,
        settings: (form.settings || {}) as Record<string, any>,
        conditional: null,
        styling: null,
        sections: [defaultSection],
        recordCount: 0,
      }
    } catch (error: any) {
      console.error("Database error creating form:", error)
      throw new Error(`Failed to create form: ${error?.message}`)
    }
  }

  static async getForm(id: string): Promise<Form | null> {
    try {
      const form = await prisma.form.findUnique({
        where: { id },
        include: {
          sections: {
            include: {
              fields: {
                orderBy: { order: "asc" },
              },
              subforms: {
                include: {
                  fields: {
                    orderBy: { order: "asc" },
                  },
                  records: true,
                },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
          records: true,
        },
      })

      if (!form) return null

      return {
        ...form,
        settings: (form.settings || {}) as Record<string, any>,
        conditional: null,
        styling: null,
        sections: form.sections.map((s) => ({
          ...s,
          conditional: (s.conditional || null) as Record<string, any> | null,
          styling: (s.styling || null) as Record<string, any> | null,
          fields: s.fields.map((f) => ({
            ...f,
            options: (f.options || []) as any[],
            validation: (f.validation || {}) as Record<string, any>,
            conditional: (f.conditional || null) as Record<string, any> | null,
            styling: (f.styling || null) as Record<string, any> | null,
            properties: (f.properties || null) as Record<string, any> | null,
            rollup: (f.rollup || null) as Record<string, any> | null,
            lookup: (f.lookup || null) as any,
            width: (f.width as "full" | "half" | "third" | "quarter") || "full",
            sourceModule: (f as any).sourceModule,
            sourceForm: (f as any).sourceForm,
            displayField: (f as any).displayField,
            valueField: (f as any).valueField,
            multiple: (f as any).multiple,
            searchable: (f as any).searchable,
            filters: (f as any).filters,
          })),
          subforms: s.subforms.map((sf) => ({
            ...sf,
            fields: sf.fields.map((f) => ({
              ...f,
              options: (f.options || []) as any[],
              validation: (f.validation || {}) as Record<string, any>,
              conditional: (f.conditional || null) as Record<string, any> | null,
              styling: (f.styling || null) as Record<string, any> | null,
              properties: (f.properties || null) as Record<string, any> | null,
              rollup: (f.rollup || null) as Record<string, any> | null,
              lookup: (f.lookup || null) as any,
              width: (f.width as "full" | "half" | "third" | "quarter") || "full",
              sourceModule: (f as any).sourceModule,
              sourceForm: (f as any).sourceForm,
              displayField: (f as any).displayField,
              valueField: (f as any).valueField,
              multiple: (f as any).multiple,
              searchable: (f as any).searchable,
              filters: (f as any).filters,
            })),
            records: sf.records.map((r) => ({
              ...r,
              recordData: (r.data || {}) as Record<string, any>,
            })),
          })),
        })),
        recordCount: form.records.length,
        records: form.records.map((r) => ({
          ...r,
          recordData: (r.recordData || {}) as Record<string, any>,
          ipAddress: r.ipAddress || undefined,
          userAgent: r.userAgent || undefined,
          createdAt: r.updatedAt,
          updatedAt: r.updatedAt,
        })),
      }
    } catch (error: any) {
      console.error("Database error fetching form:", error)
      throw new Error(`Failed to fetch form: ${error?.message}`)
    }
  }

  static async updateForm(id: string, data: Partial<Form>): Promise<Form> {
    try {
      const form = await prisma.form.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          settings: data.settings,
          isPublished: data.isPublished,
          publishedAt: data.publishedAt,
          formUrl: data.formUrl,
          allowAnonymous: data.allowAnonymous,
          requireLogin: data.requireLogin,
          maxSubmissions: data.maxSubmissions,
          submissionMessage: data.submissionMessage,
        },
        include: {
          sections: {
            include: {
              fields: {
                orderBy: { order: "asc" },
              },
              subforms: {
                include: {
                  fields: {
                    orderBy: { order: "asc" },
                  },
                  records: true,
                },
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
          records: true,
        },
      })

      return {
        ...form,
        settings: (form.settings || {}) as Record<string, any>,
        conditional: null,
        styling: null,
        sections: form.sections.map((s) => ({
          ...s,
          conditional: (s.conditional || null) as Record<string, any> | null,
          styling: (s.styling || null) as Record<string, any> | null,
          fields: s.fields.map((f) => ({
            ...f,
            options: (f.options || []) as any[],
            validation: (f.validation || {}) as Record<string, any>,
            conditional: (f.conditional || null) as Record<string, any> | null,
            styling: (f.styling || null) as Record<string, any> | null,
            properties: (f.properties || null) as Record<string, any> | null,
            rollup: (f.rollup || null) as Record<string, any> | null,
            lookup: (f.lookup || null) as any,
            width: (f.width as "full" | "half" | "third" | "quarter") || "full",
            sourceModule: (f as any).sourceModule,
            sourceForm: (f as any).sourceForm,
            displayField: (f as any).displayField,
            valueField: (f as any).valueField,
            multiple: (f as any).multiple,
            searchable: (f as any).searchable,
            filters: (f as any).filters,
          })),
          subforms: s.subforms.map((sf) => ({
            ...sf,
            fields: sf.fields.map((f) => ({
              ...f,
              options: (f.options || []) as any[],
              validation: (f.validation || {}) as Record<string, any>,
              conditional: (f.conditional || null) as Record<string, any> | null,
              styling: (f.styling || null) as Record<string, any> | null,
              properties: (f.properties || null) as Record<string, any> | null,
              rollup: (f.rollup || null) as Record<string, any> | null,
              lookup: (f.lookup || null) as any,
              width: (f.width as "full" | "half" | "third" | "quarter") || "full",
              sourceModule: (f as any).sourceModule,
              sourceForm: (f as any).sourceForm,
              displayField: (f as any).displayField,
              valueField: (f as any).valueField,
              multiple: (f as any).multiple,
              searchable: (f as any).searchable,
              filters: (f as any).filters,
            })),
            records: sf.records.map((r) => ({
              ...r,
              recordData: (r.data || {}) as Record<string, any>,
            })),
          })),
        })),
        recordCount: form.records.length,
        records: form.records.map((r) => ({
          ...r,
          recordData: (r.recordData || {}) as Record<string, any>,
          ipAddress: r.ipAddress || undefined,
          userAgent: r.userAgent || undefined,
          createdAt: r.updatedAt,
          updatedAt: r.updatedAt,
        })),
      }
    } catch (error: any) {
      console.error("Database error updating form:", error)
      throw new Error(`Failed to update form: ${error?.message}`)
    }
  }

  static async deleteForm(id: string): Promise<void> {
    try {
      await prisma.form.delete({
        where: { id },
      })
    } catch (error: any) {
      console.error("Database error deleting form:", error)
      throw new Error(`Failed to delete form: ${error?.message}`)
    }
  }

  // Section operations
  static async createSection(data: {
    formId: string
    title: string
    description?: string
    columns?: number
    order?: number
  }): Promise<FormSection> {
    try {
      const section = await prisma.formSection.create({
        data: {
          formId: data.formId,
          title: data.title,
          description: data.description,
          columns: data.columns || 1,
          order: data.order || 0,
          visible: true,
          collapsible: false,
          collapsed: false,
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
          subforms: {
            include: {
              fields: {
                orderBy: { order: "asc" },
              },
              records: true,
            },
            orderBy: { order: "asc" },
          },
        },
      })

      return {
        ...section,
        conditional: (section.conditional || null) as Record<string, any> | null,
        styling: (section.styling || null) as Record<string, any> | null,
        fields: section.fields.map((f) => ({
          ...f,
          options: (f.options || []) as any[],
          validation: (f.validation || {}) as Record<string, any>,
          conditional: (f.conditional || null) as Record<string, any> | null,
          styling: (f.styling || null) as Record<string, any> | null,
          properties: (f.properties || null) as Record<string, any> | null,
          rollup: (f.rollup || null) as Record<string, any> | null,
          lookup: (f.lookup || null) as any,
          width: (f.width as "full" | "half" | "third" | "quarter") || "full",
          sourceModule: (f as any).sourceModule,
          sourceForm: (f as any).sourceForm,
          displayField: (f as any).displayField,
          valueField: (f as any).valueField,
          multiple: (f as any).multiple,
          searchable: (f as any).searchable,
          filters: (f as any).filters,
        })),
        subforms: section.subforms.map((sf) => ({
          ...sf,
          fields: sf.fields.map((f) => ({
            ...f,
            options: (f.options || []) as any[],
            validation: (f.validation || {}) as Record<string, any>,
            conditional: (f.conditional || null) as Record<string, any> | null,
            styling: (f.styling || null) as Record<string, any> | null,
            properties: (f.properties || null) as Record<string, any> | null,
            rollup: (f.rollup || null) as Record<string, any> | null,
            lookup: (f.lookup || null) as any,
            width: (f.width as "full" | "half" | "third" | "quarter") || "full",
            sourceModule: (f as any).sourceModule,
            sourceForm: (f as any).sourceForm,
            displayField: (f as any).displayField,
            valueField: (f as any).valueField,
            multiple: (f as any).multiple,
            searchable: (f as any).searchable,
            filters: (f as any).filters,
          })),
          records: sf.records.map((r) => ({
            ...r,
            recordData: (r.data || {}) as Record<string, any>,
          })),
        })),
      }
    } catch (error: any) {
      console.error("Database error creating section:", error)
      throw new Error(`Failed to create section: ${error?.message}`)
    }
  }

  static async updateSection(id: string, data: Partial<FormSection>): Promise<FormSection> {
    try {
      const section = await prisma.formSection.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          columns: data.columns,
          order: data.order,
          visible: data.visible,
          collapsible: data.collapsible,
          collapsed: data.collapsed,
          conditional: data.conditional || undefined,
          styling: data.styling || undefined,
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
          subforms: {
            include: {
              fields: {
                orderBy: { order: "asc" },
              },
              records: true,
            },
            orderBy: { order: "asc" },
          },
        },
      })

      return {
        ...section,
        conditional: (section.conditional || null) as Record<string, any> | null,
        styling: (section.styling || null) as Record<string, any> | null,
        fields: section.fields.map((f) => ({
          ...f,
          options: (f.options || []) as any[],
          validation: (f.validation || {}) as Record<string, any>,
          conditional: (f.conditional || null) as Record<string, any> | null,
          styling: (f.styling || null) as Record<string, any> | null,
          properties: (f.properties || null) as Record<string, any> | null,
          rollup: (f.rollup || null) as Record<string, any> | null,
          lookup: (f.lookup || null) as any,
          width: (f.width as "full" | "half" | "third" | "quarter") || "full",
          sourceModule: (f as any).sourceModule,
          sourceForm: (f as any).sourceForm,
          displayField: (f as any).displayField,
          valueField: (f as any).valueField,
          multiple: (f as any).multiple,
          searchable: (f as any).searchable,
          filters: (f as any).filters,
        })),
        subforms: section.subforms.map((sf) => ({
          ...sf,
          fields: sf.fields.map((f) => ({
            ...f,
            options: (f.options || []) as any[],
            validation: (f.validation || {}) as Record<string, any>,
            conditional: (f.conditional || null) as Record<string, any> | null,
            styling: (f.styling || null) as Record<string, any> | null,
            properties: (f.properties || null) as Record<string, any> | null,
            rollup: (f.rollup || null) as Record<string, any> | null,
            lookup: (f.lookup || null) as any,
            width: (f.width as "full" | "half" | "third" | "quarter") || "full",
            sourceModule: (f as any).sourceModule,
            sourceForm: (f as any).sourceForm,
            displayField: (f as any).displayField,
            valueField: (f as any).valueField,
            multiple: (f as any).multiple,
            searchable: (f as any).searchable,
            filters: (f as any).filters,
          })),
          records: sf.records.map((r) => ({
            ...r,
            recordData: (r.data || {}) as Record<string, any>,
          })),
        })),
      }
    } catch (error: any) {
      console.error("Database error updating section:", error)
      throw new Error(`Failed to update section: ${error?.message}`)
    }
  }

  static async deleteSection(id: string): Promise<void> {
    try {
      await prisma.formSection.delete({
        where: { id },
      })
    } catch (error: any) {
      console.error("Database error deleting section:", error)
      throw new Error(`Failed to delete section: ${error?.message}`)
    }
  }

  // Field operations
  static async createField(data: {
    sectionId?: string
    subformId?: string
    type: string
    label: string
    placeholder?: string
    description?: string
    defaultValue?: string
    options?: any[]
    validation?: Record<string, any>
    visible?: boolean
    readonly?: boolean
    width?: string
    order?: number
    sourceModule?: string
    sourceForm?: string
    displayField?: string
    valueField?: string
    multiple?: boolean
    searchable?: boolean
    filters?: any
  }): Promise<FormField> {
    try {
      const field = await prisma.formField.create({
        data: {
          sectionId: data.sectionId,
          subformId: data.subformId,
          type: data.type,
          label: data.label,
          placeholder: data.placeholder,
          description: data.description,
          defaultValue: data.defaultValue,
          options: data.options || [],
          validation: data.validation || {},
          visible: data.visible ?? true,
          readonly: data.readonly ?? false,
          width: data.width || "full",
          order: data.order || 0,
          // Store lookup configuration directly on field
          sourceModule: data.sourceModule,
          sourceForm: data.sourceForm,
          displayField: data.displayField,
          valueField: data.valueField,
          multiple: data.multiple,
          searchable: data.searchable,
          filters: data.filters,
        },
      })

      return {
        ...field,
        options: (field.options || []) as any[],
        validation: (field.validation || {}) as Record<string, any>,
        conditional: (field.conditional || null) as Record<string, any> | null,
        styling: (field.styling || null) as Record<string, any> | null,
        properties: (field.properties || null) as Record<string, any> | null,
        rollup: (field.rollup || null) as Record<string, any> | null,
        lookup: (field.lookup || null) as any,
        width: (field.width as "full" | "half" | "third" | "quarter") || "full",
        sourceModule: (field as any).sourceModule,
        sourceForm: (field as any).sourceForm,
        displayField: (field as any).displayField,
        valueField: (field as any).valueField,
        multiple: (field as any).multiple,
        searchable: (field as any).searchable,
        filters: (field as any).filters,
      }
    } catch (error: any) {
      console.error("Database error creating field:", error)
      throw new Error(`Failed to create field: ${error?.message}`)
    }
  }

  static async updateField(
    id: string,
    data: Partial<
      FormField & {
        sourceModule?: string
        sourceForm?: string
        displayField?: string
        valueField?: string
        multiple?: boolean
        searchable?: boolean
        filters?: any
      }
    >,
  ): Promise<FormField> {
    try {
      const updateData: any = {
        sectionId: data.sectionId,
        subformId: data.subformId,
        type: data.type,
        label: data.label,
        placeholder: data.placeholder,
        description: data.description,
        defaultValue: data.defaultValue,
        validation: data.validation,
        visible: data.visible,
        readonly: data.readonly,
        width: data.width,
        order: data.order,
        conditional: data.conditional || undefined,
        styling: data.styling || undefined,
        properties: data.properties || undefined,
        formula: data.formula,
        rollup: data.rollup || undefined,
        lookup: data.lookup || undefined,
        // Update lookup configuration fields
        sourceModule: data.sourceModule,
        sourceForm: data.sourceForm,
        displayField: data.displayField,
        valueField: data.valueField,
        multiple: data.multiple,
        searchable: data.searchable,
        filters: data.filters,
      }

      // Handle options separately to avoid type issues
      if (data.options !== undefined) {
        updateData.options = data.options
      }

      const field = await prisma.formField.update({
        where: { id },
        data: updateData,
      })

      return {
        ...field,
        options: (field.options || []) as any[],
        validation: (field.validation || {}) as Record<string, any>,
        conditional: (field.conditional || null) as Record<string, any> | null,
        styling: (field.styling || null) as Record<string, any> | null,
        properties: (field.properties || null) as Record<string, any> | null,
        rollup: (field.rollup || null) as Record<string, any> | null,
        lookup: (field.lookup || null) as any,
        width: (field.width as "full" | "half" | "third" | "quarter") || "full",
        sourceModule: (field as any).sourceModule,
        sourceForm: (field as any).sourceForm,
        displayField: (field as any).displayField,
        valueField: (field as any).valueField,
        multiple: (field as any).multiple,
        searchable: (field as any).searchable,
        filters: (field as any).filters,
      }
    } catch (error: any) {
      console.error("Database error updating field:", error)
      throw new Error(`Failed to update field: ${error?.message}`)
    }
  }

  static async deleteField(id: string): Promise<void> {
    try {
      await prisma.formField.delete({
        where: { id },
      })
    } catch (error: any) {
      console.error("Database error deleting field:", error)
      throw new Error(`Failed to delete field: ${error?.message}`)
    }
  }

  // Form publishing
  static async publishForm(
    id: string,
    settings: {
      allowAnonymous?: boolean
      requireLogin?: boolean
      maxSubmissions?: number | null
      submissionMessage?: string
    },
  ): Promise<Form> {
    try {
      const formUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/form/${id}`

      const form = await this.updateForm(id, {
        isPublished: true,
        publishedAt: new Date(),
        formUrl,
        ...settings,
      })

      return form
    } catch (error: any) {
      console.error("Database error publishing form:", error)
      throw new Error(`Failed to publish form: ${error?.message}`)
    }
  }

  static async unpublishForm(id: string): Promise<Form> {
    try {
      const form = await this.updateForm(id, {
        isPublished: false,
        publishedAt: undefined,
        formUrl: undefined,
      })

      return form
    } catch (error: any) {
      console.error("Database error unpublishing form:", error)
      throw new Error(`Failed to unpublish form: ${error?.message}`)
    }
  }

  // Form records with enhanced querying
  static async createFormRecord(
    formId: string,
    recordData: Record<string, any>,
    submittedBy?: string,
  ): Promise<FormRecord> {
    try {
      console.log("DatabaseService.createFormRecord called with:", { formId, recordData, submittedBy })

      // Validate inputs
      if (!formId) {
        throw new Error("Form ID is required")
      }

      if (!recordData || typeof recordData !== "object") {
        throw new Error("Record data must be a valid object")
      }

      // Check if form exists
      const form = await prisma.form.findUnique({
        where: { id: formId },
        select: { id: true, name: true },
      })

      if (!form) {
        throw new Error(`Form with ID ${formId} not found`)
      }

      console.log("Form found:", form.name)

      // Create the record
      const record = await prisma.formRecord.create({
        data: {
          formId,
          recordData: recordData as any, // Prisma handles JSONB conversion
          submittedBy: submittedBy || "anonymous",
          submittedAt: new Date(),
        },
      })

      console.log("Record created successfully:", record.id)

      return {
        ...record,
        recordData: (record.recordData || {}) as Record<string, any>,
        ipAddress: record.ipAddress || undefined,
        userAgent: record.userAgent || undefined,
        createdAt: record.updatedAt,
        updatedAt: record.updatedAt,
      }
    } catch (error: any) {
      console.error("Error in DatabaseService.createFormRecord:", error)
      throw new Error(`Failed to create form record: ${error.message}`)
    }
  }

  static async getFormRecords(
    formId: string,
    options?: {
      page?: number
      limit?: number
      status?: string
      search?: string
      sortBy?: string
      sortOrder?: "asc" | "desc"
    },
  ): Promise<FormRecord[]> {
    try {
      const { page = 1, limit = 50, status, search, sortBy = "submittedAt", sortOrder = "desc" } = options || {}

      const where: any = { formId }

      if (status && status !== "all") {
        where.status = status
      }

      // JSONB search capabilities
      if (search) {
        where.OR = [
          {
            submittedBy: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            recordData: {
              path: [],
              string_contains: search,
            },
          },
        ]
      }

      const records = await prisma.formRecord.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          form: {
            include: {
              sections: {
                include: {
                  fields: {
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      })

      return records.map((r) => ({
        ...r,
        recordData: (r.recordData || {}) as Record<string, any>,
        ipAddress: r.ipAddress || undefined,
        userAgent: r.userAgent || undefined,
        createdAt: r.updatedAt,
        updatedAt: r.updatedAt,
        form: r.form
          ? {
            ...r.form,
            settings: (r.form.settings || {}) as Record<string, any>,
            conditional: null,
            styling: null,
            sections: r.form.sections.map((s) => ({
              ...s,
              conditional: (s.conditional || null) as Record<string, any> | null,
              styling: (s.styling || null) as Record<string, any> | null,
              fields: s.fields.map((f) => ({
                ...f,
                options: (f.options || []) as any[],
                validation: (f.validation || {}) as Record<string, any>,
                conditional: (f.conditional || null) as Record<string, any> | null,
                styling: (f.styling || null) as Record<string, any> | null,
                properties: (f.properties || null) as Record<string, any> | null,
                rollup: (f.rollup || null) as Record<string, any> | null,
                lookup: (f.lookup || null) as any,
                width: (f.width as "full" | "half" | "third" | "quarter") || "full",
                sourceModule: (f as any).sourceModule,
                sourceForm: (f as any).sourceForm,
                displayField: (f as any).displayField,
                valueField: (f as any).valueField,
                multiple: (f as any).multiple,
                searchable: (f as any).searchable,
                filters: (f as any).filters,
              })),
              subforms: [],
            })),
            recordCount: 0,
          }
          : undefined,
      }))
    } catch (error: any) {
      console.error("Database error fetching form records:", error)
      throw new Error(`Failed to fetch form records: ${error?.message}`)
    }
  }

  static async getFormSubmissionCount(formId: string): Promise<number> {
    try {
      const count = await prisma.formRecord.count({
        where: { formId },
      })
      return count
    } catch (error: any) {
      console.error("Database error getting form submission count:", error)
      throw new Error(`Failed to get form submission count: ${error?.message}`)
    }
  }

  static async updateFormRecord(id: string, data: Partial<FormRecord>): Promise<FormRecord> {
    try {
      const record = await prisma.formRecord.update({
        where: { id },
        data: {
          recordData: data.recordData,
          submittedBy: data.submittedBy,
        },
      })

      return {
        ...record,
        recordData: (record.recordData || {}) as Record<string, any>,
        ipAddress: record.ipAddress || undefined,
        userAgent: record.userAgent || undefined,
        createdAt: record.updatedAt,
        updatedAt: record.updatedAt,
      }
    } catch (error: any) {
      console.error("Database error updating form record:", error)
      throw new Error(`Failed to update form record: ${error?.message}`)
    }
  }

  static async deleteFormRecord(id: string): Promise<void> {
    try {
      await prisma.formRecord.delete({
        where: { id },
      })
    } catch (error: any) {
      console.error("Database error deleting form record:", error)
      throw new Error(`Failed to delete form record: ${error?.message}`)
    }
  }

  // Analytics
  static async trackFormEvent(
    formId: string,
    eventType: string,
    payload?: Record<string, any>,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<FormEvent> {
    try {
      const event = await prisma.formEvent.create({
        data: {
          formId: formId,
          eventType: eventType,
          payload: payload || {},
          sessionId: sessionId,
          userAgent: userAgent,
          ipAddress: ipAddress,
        },
      })

      return {
        ...event,
        payload: (event.payload || {}) as Record<string, any>,
        ipAddress: event.ipAddress || undefined,
        userAgent: event.userAgent || undefined,
        sessionId: event.sessionId || undefined,
      }
    } catch (error: any) {
      console.error("Database error tracking form event:", error)
      throw new Error(`Failed to track form event: ${error?.message}`)
    }
  }

  static async getFormAnalytics(formId: string): Promise<{
    totalViews: number
    totalSubmissions: number
    conversionRate: number
    events: FormEvent[]
  }> {
    try {
      const events = await prisma.formEvent.findMany({
        where: { formId },
        orderBy: { createdAt: "desc" },
      })

      const totalViews = events.filter((e) => e.eventType === "view").length
      const totalSubmissions = events.filter((e) => e.eventType === "submit").length
      const conversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0

      return {
        totalViews,
        totalSubmissions,
        conversionRate,
        events: events.map((e) => ({
          ...e,
          payload: (e.payload || {}) as Record<string, any>,
          ipAddress: e.ipAddress || undefined,
          userAgent: e.userAgent || undefined,
          sessionId: e.sessionId || undefined,
        })),
      }
    } catch (error: any) {
      console.error("Database error fetching form analytics:", error)
      throw new Error(`Failed to fetch form analytics: ${error?.message}`)
    }
  }

  // Field types
  static async getFieldTypes(): Promise<FieldType[]> {
    try {
      const fieldTypes = await prisma.fieldType.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      })

      return fieldTypes.map((ft) => ({
        ...ft,
        description: ft.description || "",
        defaultProps: (ft.defaultProps || {}) as Record<string, any>,
      }))
    } catch (error: any) {
      console.error("Database error fetching field types:", error)
      throw new Error(`Failed to fetch field types: ${error?.message}`)
    }
  }

  static async upsertFieldType(data: {
    name: string
    label: string
    category: string
    icon: string
    description: string
    defaultProps: Record<string, any>
    active: boolean
  }): Promise<FieldType> {
    try {
      const fieldType = await prisma.fieldType.upsert({
        where: { name: data.name },
        update: data,
        create: data,
      })

      return {
        ...fieldType,
        description: fieldType.description || "",
        defaultProps: (fieldType.defaultProps || {}) as Record<string, any>,
      }
    } catch (error: any) {
      console.error("Database error upserting field type:", error)
      throw new Error(`Failed to upsert field type: ${error?.message}`)
    }
  }

  static async seedFieldTypes(): Promise<void> {
    try {
      const defaultFieldTypes = [
        {
          name: "text",
          label: "Text Input",
          category: "basic",
          icon: "Type",
          description: "Single line text input",
          defaultProps: {
            type: "text",
            label: "Text Field",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
          },
          active: true,
        },
        {
          name: "textarea",
          label: "Text Area",
          category: "basic",
          icon: "AlignLeft",
          description: "Multi-line text input",
          defaultProps: {
            type: "textarea",
            label: "Text Area",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
            rows: 3,
          },
          active: true,
        },
        {
          name: "number",
          label: "Number",
          category: "basic",
          icon: "Hash",
          description: "Numeric input field",
          defaultProps: {
            type: "number",
            label: "Number Field",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
          },
          active: true,
        },
        {
          name: "email",
          label: "Email",
          category: "basic",
          icon: "Mail",
          description: "Email address input",
          defaultProps: {
            type: "email",
            label: "Email Field",
            validation: { email: true },
            width: "full",
            visible: true,
            readonly: false,
          },
          active: true,
        },
        {
          name: "date",
          label: "Date",
          category: "basic",
          icon: "Calendar",
          description: "Date picker field",
          defaultProps: {
            type: "date",
            label: "Date Field",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
          },
          active: true,
        },
        {
          name: "checkbox",
          label: "Checkbox",
          category: "choice",
          icon: "CheckSquare",
          description: "Single checkbox",
          defaultProps: {
            type: "checkbox",
            label: "Checkbox",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
          },
          active: true,
        },
        {
          name: "radio",
          label: "Radio Buttons",
          category: "choice",
          icon: "Radio",
          description: "Multiple choice (single select)",
          defaultProps: {
            type: "radio",
            label: "Radio Group",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
            options: [
              { id: "opt1", label: "Option 1", value: "option1" },
              { id: "opt2", label: "Option 2", value: "option2" },
            ],
          },
          active: true,
        },
        {
          name: "select",
          label: "Dropdown",
          category: "choice",
          icon: "ChevronDown",
          description: "Dropdown select list",
          defaultProps: {
            type: "select",
            label: "Dropdown",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
            options: [
              { id: "opt1", label: "Option 1", value: "option1" },
              { id: "opt2", label: "Option 2", value: "option2" },
            ],
          },
          active: true,
        },
        {
          name: "file",
          label: "File Upload",
          category: "advanced",
          icon: "Upload",
          description: "Upload files",
          defaultProps: {
            type: "file",
            label: "File Upload",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
            multiple: false,
          },
          active: true,
        },
        {
          name: "lookup",
          label: "Lookup",
          category: "advanced",
          icon: "Search",
          description: "Reference data from other sources",
          defaultProps: {
            type: "lookup",
            label: "Lookup Field",
            validation: {},
            width: "full",
            visible: true,
            readonly: false,
          },
          active: true,
        },
      ]

      for (const fieldType of defaultFieldTypes) {
        await this.upsertFieldType(fieldType)
      }
    } catch (error: any) {
      console.error("Database error seeding field types:", error)
      throw new Error(`Failed to seed field types: ${error?.message}`)
    }
  }
}

// Export an instance of the DatabaseService as 'db'
export const db = DatabaseService
