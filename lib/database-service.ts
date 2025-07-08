import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import type { FormModule, Form, FormSection, FormField, FormRecord, FormEvent, FieldType } from "@/types/form-builder"

export class DatabaseService {
  // Helper method to transform raw module data to include hierarchy fields
  private static transformModule(rawModule: any, level: number = 0, parentPath: string = ""): FormModule {
    const settings = (rawModule.settings || {}) as Record<string, any>
    
    // Extract hierarchy data from settings or calculate defaults
    const moduleType = rawModule.moduleType || (level === 0 ? "master" : "child")
    const modulePath = rawModule.path || rawModule.name.toLowerCase().replace(/\s+/g, '-')
    const fullPath = parentPath ? `${parentPath}/${modulePath}` : modulePath
    
    return {
      ...rawModule,
      settings,
      // Add hierarchy fields that don't exist in Prisma schema
      parentId: rawModule.parentId || null,
      parent: rawModule.parent || null,
      children: rawModule.children ? rawModule.children.map((child: any) => 
        this.transformModule(child, level + 1, fullPath)
      ) : [],
      moduleType: moduleType as "master" | "child" | "standard",
      level: rawModule.level || level,
      path: rawModule.path || fullPath,
      isActive: rawModule.isActive ?? true,
      sortOrder: rawModule.sortOrder || 0,
      forms: rawModule.forms ? rawModule.forms.map((form: any) => this.transformForm(form)) : [],
    }
  }

  // Helper method to transform form data
  private static transformForm(rawForm: any): Form {
    return {
      ...rawForm,
      settings: (rawForm.settings || {}) as Record<string, any>,
      conditional: rawForm.conditional || null,
      styling: rawForm.styling || null,
      sections: rawForm.sections ? rawForm.sections.map((s: any) => this.transformSection(s)) : [],
      recordCount: this.calculateRecordCount(rawForm),
      records: this.transformRecords(rawForm),
    }
  }

  // Calculate total record count from all record tables
  private static calculateRecordCount(form: any): number {
    if (!form._count) return 0;
    
    return (
      (form._count.records1 || 0) +
      (form._count.records2 || 0) +
      (form._count.records3 || 0) +
      (form._count.records4 || 0) +
      (form._count.records5 || 0) +
      (form._count.records6 || 0) +
      (form._count.records7 || 0) +
      (form._count.records8 || 0) +
      (form._count.records9 || 0) +
      (form._count.records10 || 0) +
      (form._count.records11 || 0) +
      (form._count.records12 || 0) +
      (form._count.records13 || 0) +
      (form._count.records14 || 0) +
      (form._count.records15 || 0)
    );
  }

  // Transform records from all tables
  private static transformRecords(form: any): any[] {
    const allRecords = [
      ...(form.records1 || []),
      ...(form.records2 || []),
      ...(form.records3 || []),
      ...(form.records4 || []),
      ...(form.records5 || []),
      ...(form.records6 || []),
      ...(form.records7 || []),
      ...(form.records8 || []),
      ...(form.records9 || []),
      ...(form.records10 || []),
      ...(form.records11 || []),
      ...(form.records12 || []),
      ...(form.records13 || []),
      ...(form.records14 || []),
      ...(form.records15 || [])
    ];
    
    return allRecords.map(r => this.transformRecord(r));
  }

  // Helper method to transform section data
  private static transformSection(rawSection: any): FormSection {
    return {
      ...rawSection,
      conditional: (rawSection.conditional || null) as Record<string, any> | null,
      styling: (rawSection.styling || null) as Record<string, any> | null,
      fields: rawSection.fields ? rawSection.fields.map((f: any) => this.transformField(f)) : [],
      subforms: rawSection.subforms ? rawSection.subforms.map((sf: any) => this.transformSubform(sf)) : [],
    }
  }

  // Helper method to transform field data
  private static transformField(rawField: any): FormField {
    return {
      ...rawField,
      options: (rawField.options || []) as any[],
      validation: (rawField.validation || {}) as Record<string, any>,
      conditional: (rawField.conditional || null) as Record<string, any> | null,
      styling: (rawField.styling || null) as Record<string, any> | null,
      properties: (rawField.properties || null) as Record<string, any> | null,
      rollup: (rawField.rollup || null) as Record<string, any> | null,
      lookup: (rawField.lookup || null) as any,
      width: (rawField.width as "full" | "half" | "third" | "quarter") || "full",
    }
  }

  // Helper method to transform subform data
  private static transformSubform(rawSubform: any): any {
    return {
      ...rawSubform,
      fields: rawSubform.fields ? rawSubform.fields.map((f: any) => this.transformField(f)) : [],
      records: rawSubform.records ? rawSubform.records.map((r: any) => ({
        ...r,
        recordData: (r.data || {}) as Record<string, any>,
      })) : [],
    }
  }

  // Helper method to transform record data
  private static transformRecord(rawRecord: any): FormRecord {
    return {
      ...rawRecord,
      recordData: (rawRecord.recordData || {}) as Record<string, any>,
      employee_id: rawRecord.employee_id || null,
      amount: rawRecord.amount ? Number(rawRecord.amount) : null,
      date: rawRecord.date || null,
      ipAddress: rawRecord.ipAddress || undefined,
      userAgent: rawRecord.userAgent || undefined,
      createdAt: rawRecord.createdAt || rawRecord.updatedAt,
      updatedAt: rawRecord.updatedAt,
    }
  }

  // Get the appropriate record table for a form
  static async getFormRecordTable(formId: string): Promise<string> {
    // Check if form has a mapping
    const mapping = await prisma.formTableMapping.findUnique({
      where: { formId },
    })

    if (mapping) {
      return mapping.storageTable
    }

    // If no mapping exists, create one
    const result = await prisma.$queryRaw<{ assign_form_to_record_table: string }[]>`
      SELECT assign_form_to_record_table(${formId}) as assign_form_to_record_table
    `
    
    return result[0].assign_form_to_record_table
  }

  // Module operations with hierarchy support
  static async createModule(data: { 
    name: string; 
    description?: string; 
    parentId?: string;
    moduleType?: string;
    icon?: string;
    color?: string;
  }): Promise<FormModule> {
    if (!data.name || data.name.trim() === "") {
      throw new Error("Module name is required")
    }

    try {
      // Calculate hierarchy data
      let level = 0
      let moduleType = data.moduleType || "standard"

      if (data.parentId) {
        // Get parent module to calculate level
        const parentModule = await prisma.formModule.findUnique({
          where: { id: data.parentId },
          select: { level: true }
        })
        
        if (parentModule) {
          level = parentModule.level + 1
        }
        
        moduleType = "child"
      } else {
        moduleType = "master"
      }

      const module = await prisma.formModule.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          icon: data.icon || null,
          color: data.color || null,
          parentId: data.parentId || null,
          moduleType,
          level,
          isActive: true,
          sortOrder: 0,
        },
        include: {
          forms: {
            include: {
              tableMapping: true,
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

      const transformedModule = this.transformModule(module, level)
      return {
        ...transformedModule,
        forms: [defaultForm],
      }
    } catch (error: any) {
      console.error("Database error creating module:", error)
      throw new Error(`Failed to create module: ${error?.message}`)
    }
  }

  // Get modules with proper hierarchy structure
  static async getModuleHierarchy(): Promise<FormModule[]> {
    try {
      // Get all modules
      const allModules = await prisma.formModule.findMany({
        include: {
          forms: {
            include: {
              tableMapping: true,
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
              _count: {
                select: {
                  records1: true,
                  records2: true,
                  records3: true,
                  records4: true,
                  records5: true,
                  records6: true,
                  records7: true,
                  records8: true,
                  records9: true,
                  records10: true,
                  records11: true,
                  records12: true,
                  records13: true,
                  records14: true,
                  records15: true,
                },
              },
            },
          },
        },
        orderBy: [
          { level: "asc" },
          { sortOrder: "asc" },
          { name: "asc" },
        ],
      })

      // Build hierarchy from flat list
      const moduleMap = new Map<string, any>()
      const rootModules: any[] = []

      // First pass: create map and identify root modules
      allModules.forEach(module => {
        moduleMap.set(module.id, { ...module, children: [] })
        
        if (!module.parentId) {
          rootModules.push(moduleMap.get(module.id))
        }
      })

      // Second pass: build parent-child relationships
      allModules.forEach(module => {
        if (module.parentId && moduleMap.has(module.parentId)) {
          const parent = moduleMap.get(module.parentId)
          const child = moduleMap.get(module.id)
          parent.children.push(child)
        }
      })

      // Transform to proper format with hierarchy levels
      return rootModules.map(module => this.transformModuleHierarchy(module, 0))
    } catch (error: any) {
      console.error("Database error fetching module hierarchy:", error)
      throw new Error(`Failed to fetch module hierarchy: ${error?.message}`)
    }
  }

  // Recursive helper to transform hierarchy with proper levels
  private static transformModuleHierarchy(module: any, level: number): FormModule {
    const transformed = this.transformModule(module, level)
    
    if (module.children && module.children.length > 0) {
      transformed.children = module.children.map((child: any) => 
        this.transformModuleHierarchy(child, level + 1)
      )
    }
    
    return transformed
  }

  // Legacy method for backward compatibility - returns flat list
  static async getModules(): Promise<FormModule[]> {
    try {
      const hierarchyModules = await this.getModuleHierarchy()
      return this.flattenModuleHierarchy(hierarchyModules)
    } catch (error: any) {
      console.error("Database error fetching modules:", error)
      throw new Error(`Failed to fetch modules: ${error?.message}`)
    }
  }

  // Flatten hierarchy into a flat list
  private static flattenModuleHierarchy(modules: FormModule[]): FormModule[] {
    const flattened: FormModule[] = []
    
    const flatten = (moduleList: FormModule[]) => {
      for (const module of moduleList) {
        flattened.push(module)
        if (module.children && module.children.length > 0) {
          flatten(module.children)
        }
      }
    }
    
    flatten(modules)
    return flattened
  }

  static async getModule(id: string): Promise<FormModule | null> {
    try {
      const module = await prisma.formModule.findUnique({
        where: { id },
        include: {
          forms: {
            include: {
              tableMapping: true,
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
              _count: {
                select: {
                  records1: true,
                  records2: true,
                  records3: true,
                  records4: true,
                  records5: true,
                  records6: true,
                  records7: true,
                  records8: true,
                  records9: true,
                  records10: true,
                  records11: true,
                  records12: true,
                  records13: true,
                  records14: true,
                  records15: true,
                },
              },
            },
          },
        },
      })

      if (!module) return null

      return this.transformModule(module)
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
          parentId: data.parentId,
          moduleType: data.moduleType,
          level: data.level,
          path: data.path,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
        include: {
          forms: {
            include: {
              tableMapping: true,
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
              _count: {
                select: {
                  records1: true,
                  records2: true,
                  records3: true,
                  records4: true,
                  records5: true,
                  records6: true,
                  records7: true,
                  records8: true,
                  records9: true,
                  records10: true,
                  records11: true,
                  records12: true,
                  records13: true,
                  records14: true,
                  records15: true,
                },
              },
            },
          },
        },
      })

      return this.transformModule(module)
    } catch (error: any) {
      console.error("Database error updating module:", error)
      throw new Error(`Failed to update module: ${error?.message}`)
    }
  }

  static async moveModule(moduleId: string, newParentId?: string): Promise<FormModule> {
    try {
      // Calculate new level
      let level = 0
      
      if (newParentId) {
        const parent = await prisma.formModule.findUnique({
          where: { id: newParentId },
          select: { level: true }
        })
        
        if (parent) {
          level = parent.level + 1
        }
      }
      
      // Update module
      const module = await prisma.formModule.update({
        where: { id: moduleId },
        data: {
          parentId: newParentId || null,
          level,
          moduleType: newParentId ? "child" : "master",
        },
        include: {
          forms: {
            include: {
              tableMapping: true,
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
              _count: {
                select: {
                  records1: true,
                  records2: true,
                  records3: true,
                  records4: true,
                  records5: true,
                  records6: true,
                  records7: true,
                  records8: true,
                  records9: true,
                  records10: true,
                  records11: true,
                  records12: true,
                  records13: true,
                  records14: true,
                  records15: true,
                },
              },
            },
          },
        },
      })

      return this.transformModule(module, level)
    } catch (error: any) {
      console.error("Database error moving module:", error)
      throw new Error(`Failed to move module: ${error?.message}`)
    }
  }

  static async deleteModule(id: string): Promise<void> {
    try {
      // Check if module has children
      const childrenCount = await prisma.formModule.count({
        where: { parentId: id }
      })

      if (childrenCount > 0) {
        throw new Error("Cannot delete module with child modules. Please delete or move child modules first.")
      }

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
          tableMapping: true,
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
        ...this.transformForm(form),
        sections: [defaultSection],
      }
    } catch (error: any) {
      console.error("Database error creating form:", error)
      throw new Error(`Failed to create form: ${error?.message}`)
    }
  }

  static async getForms(moduleId?: string): Promise<Form[]> {
    try {
      const forms = await prisma.form.findMany({
        where: moduleId ? { moduleId } : undefined,
        include: {
          tableMapping: true,
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
          _count: {
            select: {
              records1: true,
              records2: true,
              records3: true,
              records4: true,
              records5: true,
              records6: true,
              records7: true,
              records8: true,
              records9: true,
              records10: true,
              records11: true,
              records12: true,
              records13: true,
              records14: true,
              records15: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return forms.map(form => this.transformForm(form))
    } catch (error: any) {
      console.error("Database error fetching forms:", error)
      throw new Error(`Failed to fetch forms: ${error.message}`)
    }
  }

  static async getForm(id: string): Promise<Form | null> {
    try {
      const form = await prisma.form.findUnique({
        where: { id },
        include: {
          tableMapping: true,
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
          _count: {
            select: {
              records1: true,
              records2: true,
              records3: true,
              records4: true,
              records5: true,
              records6: true,
              records7: true,
              records8: true,
              records9: true,
              records10: true,
              records11: true,
              records12: true,
              records13: true,
              records14: true,
              records15: true,
            },
          },
        },
      })

      if (!form) return null

      return this.transformForm(form)
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
          conditional: data.conditional,
          styling: data.styling,
        },
        include: {
          tableMapping: true,
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
          _count: {
            select: {
              records1: true,
              records2: true,
              records3: true,
              records4: true,
              records5: true,
              records6: true,
              records7: true,
              records8: true,
              records9: true,
              records10: true,
              records11: true,
              records12: true,
              records13: true,
              records14: true,
              records15: true,
            },
          },
        },
      })

      return this.transformForm(form)
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

      return this.transformSection(section)
    } catch (error: any) {
      console.error("Database error creating section:", error)
      throw new Error(`Failed to create section: ${error?.message}`)
    }
  }

  static async getSections(formId: string): Promise<FormSection[]> {
    try {
      const sections = await prisma.formSection.findMany({
        where: { formId },
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
      })

      return sections.map(section => this.transformSection(section))
    } catch (error: any) {
      console.error("Database error fetching sections:", error)
      throw new Error(`Failed to fetch sections: ${error.message}`)
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

      return this.transformSection(section)
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

  /**
   * Enhanced section deletion with complete cleanup of associated records
   */
  static async deleteSectionWithCleanup(sectionId: string): Promise<void> {
    try {
      console.log("[DatabaseService] Starting section deletion with cleanup:", sectionId)

      // First, get the section with all its fields to know what to clean up
      const section = await prisma.formSection.findUnique({
        where: { id: sectionId },
        include: {
          fields: true,
          form: {
            select: { id: true, name: true, tableMapping: true },
          },
        },
      })

      if (!section) {
        throw new Error(`Section with ID ${sectionId} not found`)
      }

      const formId = section.formId
      const fieldLabels = section.fields.map((f) => f.label)

      console.log(
        `[DatabaseService] Found section "${section.title}" with ${section.fields.length} fields:`,
        fieldLabels,
      )

      // Step 1: Clean up form records - remove field data for deleted fields
      if (fieldLabels.length > 0 && section.form.tableMapping) {
        console.log("[DatabaseService] Cleaning up form records...")
        
        const tableName = section.form.tableMapping.storageTable
        
        // Get all records for this form from the appropriate table
        const records = await this.getFormRecords(formId)
        
        console.log(`[DatabaseService] Found ${records.length} records to clean`)

        // Clean each record by removing data for deleted fields
        for (const record of records) {
          const recordData = (record.recordData as any) || {}
          let hasChanges = false

          // Remove data for each deleted field
          for (const fieldLabel of fieldLabels) {
            if (recordData[fieldLabel]) {
              delete recordData[fieldLabel]
              hasChanges = true
              console.log(`[DatabaseService] Removed field "${fieldLabel}" from record ${record.id}`)
            }
          }

          // Update record if changes were made
          if (hasChanges) {
            await this.updateFormRecord(record.id, {
              recordData,
              updatedAt: new Date(),
            })

            console.log(`[DatabaseService] Updated record ${record.id}`)
          }
        }

        console.log("[DatabaseService] Form records cleanup completed")
      }

      // Step 2: Clean up lookup relations for deleted fields
      console.log("[DatabaseService] Cleaning up lookup relations...")

      const fieldIds = section.fields.map((f) => f.id)

      if (fieldIds.length > 0) {
        const deletedRelations = await prisma.lookupFieldRelation.deleteMany({
          where: {
            formFieldId: { in: fieldIds },
          },
        })

        console.log(`[DatabaseService] Deleted ${deletedRelations.count} lookup relations`)
      }

      // Step 3: Delete the section (this will cascade delete fields due to foreign key constraints)
      console.log("[DatabaseService] Deleting section and fields...")

      await prisma.formSection.delete({
        where: { id: sectionId },
      })

      console.log(
        `[DatabaseService] Successfully deleted section "${section.title}" and cleaned up all associated data`,
      )

      // Step 4: Reorder remaining sections
      console.log("[DatabaseService] Reordering remaining sections...")

      const remainingSections = await prisma.formSection.findMany({
        where: { formId },
        orderBy: { order: "asc" },
      })

      // Update order for remaining sections
      for (let i = 0; i < remainingSections.length; i++) {
        if (remainingSections[i].order !== i) {
          await prisma.formSection.update({
            where: { id: remainingSections[i].id },
            data: { order: i },
          })
        }
      }

      console.log(`[DatabaseService] Reordered ${remainingSections.length} remaining sections`)

      console.log("[DatabaseService] Section deletion with cleanup completed successfully")
    } catch (error: any) {
      console.error("Database error deleting section with cleanup:", error)
      throw new Error(`Failed to delete section with cleanup: ${error?.message}`)
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
    lookup?: any
  }): Promise<FormField> {
    try {
      console.log("[DatabaseService] Creating field with data:", data)

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
          lookup: data.lookup, // Store complete lookup configuration
        },
      })

      console.log("[DatabaseService] Field created successfully:", field.id)

      // Handle lookup relations after field creation
      if (data.type === "lookup" && data.lookup?.sourceId) {
        try {
          await this.handleLookupRelations(field.id, data)
        } catch (error: any) {
          console.error("[DatabaseService] Error handling lookup relations:", error.message)
          // Don't fail the field creation if lookup relations fail
        }
      }

      return this.transformField(field)
    } catch (error: any) {
      console.error("Database error creating field:", error)
      throw new Error(`Failed to create field: ${error?.message}`)
    }
  }

  private static async handleLookupRelations(fieldId: string, fieldData: any): Promise<void> {
    console.log("[DatabaseService] Handling lookup relations for field:", fieldId)

    if (!fieldData.lookup?.sourceId) {
      console.error("[DatabaseService] Lookup field missing source information", { fieldId })
      return
    }

    const lookupSourceId = fieldData.lookup.sourceId

    // Get form and module info from the field's section
    let formId: string | null = null
    let moduleId: string | null = null

    if (fieldData.sectionId) {
      const section = await prisma.formSection.findUnique({
        where: { id: fieldData.sectionId },
        select: { formId: true, form: { select: { moduleId: true } } },
      })

      if (section) {
        formId = section.formId
        moduleId = section.form.moduleId
      }
    } else if (fieldData.subformId) {
      const subform = await prisma.subform.findUnique({
        where: { id: fieldData.subformId },
        select: { section: { select: { formId: true, form: { select: { moduleId: true } } } } },
      })

      if (subform?.section) {
        formId = subform.section.formId
        moduleId = subform.section.form.moduleId
      }
    }

    if (!formId || !moduleId) {
      console.error("[DatabaseService] Could not determine form/module for field", { fieldId })
      return
    }

    // Ensure LookupSource exists
    let lookupSource = await prisma.lookupSource.findUnique({
      where: { id: lookupSourceId },
    })

    if (!lookupSource) {
      console.log("[DatabaseService] Creating new LookupSource", { lookupSourceId })

      if (lookupSourceId.startsWith("module_")) {
        const sourceModuleId = lookupSourceId.replace("module_", "")
        const module = await prisma.formModule.findUnique({
          where: { id: sourceModuleId },
        })

        if (module) {
          lookupSource = await prisma.lookupSource.create({
            data: {
              id: lookupSourceId,
              name: module.name,
              type: "module",
              sourceModuleId: module.id,
              description: module.description || `Module with forms`,
              active: true,
            },
          })
        }
      } else if (lookupSourceId.startsWith("form_")) {
        const sourceFormId = lookupSourceId.replace("form_", "")
        const sourceForm = await prisma.form.findUnique({
          where: { id: sourceFormId },
        })

        if (sourceForm) {
          lookupSource = await prisma.lookupSource.create({
            data: {
              id: lookupSourceId,
              name: sourceForm.name,
              type: "form",
              sourceFormId: sourceForm.id,
              description: sourceForm.description || `Form source`,
              active: true,
            },
          })
        }
      }
    }

    if (!lookupSource) {
      console.error("[DatabaseService] Failed to create/find LookupSource", { lookupSourceId })
      return
    }

    // Create LookupFieldRelation
    const relationId = `lfr_${lookupSourceId}_${fieldId}`

    await prisma.lookupFieldRelation.upsert({
      where: { id: relationId },
      update: {
        lookupSourceId,
        formFieldId: fieldId,
        formId,
        moduleId,
        displayField: fieldData.lookup.fieldMapping?.display,
        valueField: fieldData.lookup.fieldMapping?.value,
        multiple: fieldData.lookup.multiple,
        searchable: fieldData.lookup.searchable,
        filters: fieldData.lookup.filters || {},
        updatedAt: new Date(),
      },
      create: {
        id: relationId,
        lookupSourceId,
        formFieldId: fieldId,
        formId,
        moduleId,
        displayField: fieldData.lookup.fieldMapping?.display,
        valueField: fieldData.lookup.fieldMapping?.value,
        multiple: fieldData.lookup.multiple,
        searchable: fieldData.lookup.searchable,
        filters: fieldData.lookup.filters || {},
      },
    })

    console.log("[DatabaseService] Successfully created/updated LookupFieldRelation", { relationId })
  }

  static async getFields(sectionId: string): Promise<FormField[]> {
    try {
      const fields = await prisma.formField.findMany({
        where: { sectionId },
        orderBy: { order: "asc" },
      })

      return fields.map(field => this.transformField(field))
    } catch (error: any) {
      console.error("Database error fetching fields:", error)
      throw new Error(`Failed to fetch fields: ${error.message}`)
    }
  }

  static async updateField(id: string, data: Partial<FormField>): Promise<FormField> {
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
      }

      // Handle options separately to avoid type issues
      if (data.options !== undefined) {
        updateData.options = data.options
      }

      const field = await prisma.formField.update({
        where: { id },
        data: updateData,
      })

      // Update lookup relations if needed
      if (data.lookup?.sourceId) {
        try {
          await this.handleLookupRelations(id, data)
        } catch (error: any) {
          console.error("[DatabaseService] Error updating lookup relations:", error.message)
        }
      }

      return this.transformField(field)
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

  // Create a form record in the appropriate table
  static async createFormRecord(
    formId: string, 
    recordData: any, 
    submittedBy?: string, 
    employeeId?: string, 
    amount?: number, 
    date?: Date
  ): Promise<FormRecord> {
    try {
      console.log("DatabaseService.createFormRecord called with:", { 
        formId, 
        recordData, 
        submittedBy,
        employeeId,
        amount,
        date
      })

      // Validate inputs
      if (!formId) {
        throw new Error("Form ID is required")
      }

      if (!recordData || typeof recordData !== "object") {
        throw new Error("Record data must be a valid object")
      }

      // Get the appropriate table for this form
      const tableName = await this.getFormRecordTable(formId)
      console.log(`Using table ${tableName} for form ${formId}`)
      
      // Base record data
      const recordParams = {
        id: uuidv4(),
        formId,
        recordData,
        submittedBy: submittedBy || "anonymous",
        employee_id: employeeId,
        amount: amount ? new Prisma.Decimal(amount) : null,
        date: date || null,
        submittedAt: new Date(),
        status: "submitted",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Create record in the appropriate table
      let record
      
      switch (tableName) {
        case "form_records_1":
          record = await prisma.formRecord1.create({ data: recordParams })
          break
        case "form_records_2":
          record = await prisma.formRecord2.create({ data: recordParams })
          break
        case "form_records_3":
          record = await prisma.formRecord3.create({ data: recordParams })
          break
        case "form_records_4":
          record = await prisma.formRecord4.create({ data: recordParams })
          break
        case "form_records_5":
          record = await prisma.formRecord5.create({ data: recordParams })
          break
        case "form_records_6":
          record = await prisma.formRecord6.create({ data: recordParams })
          break
        case "form_records_7":
          record = await prisma.formRecord7.create({ data: recordParams })
          break
        case "form_records_8":
          record = await prisma.formRecord8.create({ data: recordParams })
          break
        case "form_records_9":
          record = await prisma.formRecord9.create({ data: recordParams })
          break
        case "form_records_10":
          record = await prisma.formRecord10.create({ data: recordParams })
          break
        case "form_records_11":
          record = await prisma.formRecord11.create({ data: recordParams })
          break
        case "form_records_12":
          record = await prisma.formRecord12.create({ data: recordParams })
          break
        case "form_records_13":
          record = await prisma.formRecord13.create({ data: recordParams })
          break
        case "form_records_14":
          record = await prisma.formRecord14.create({ data: recordParams })
          break
        case "form_records_15":
          record = await prisma.formRecord15.create({ data: recordParams })
          break
        default:
          throw new Error(`Invalid table name: ${tableName}`)
      }

      console.log("Record created successfully:", record.id)
      return this.transformRecord(record)
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
      employeeId?: string
      dateFrom?: Date
      dateTo?: Date
    },
  ): Promise<FormRecord[]> {
    try {
      const { 
        page = 1, 
        limit = 50, 
        status, 
        search, 
        sortBy = "submittedAt", 
        sortOrder = "desc",
        employeeId,
        dateFrom,
        dateTo
      } = options || {}

      const tableName = await this.getFormRecordTable(formId)
      const skip = (page - 1) * limit
      
      // Build where clause
      const where: any = { formId }
      
      if (status && status !== "all") {
        where.status = status
      }
      
      if (employeeId) {
        where.employee_id = employeeId
      }
      
      if (dateFrom || dateTo) {
        where.date = {}
        if (dateFrom) where.date.gte = dateFrom
        if (dateTo) where.date.lte = dateTo
      }
      
      // Build orderBy
      const orderBy: any = {}
      orderBy[sortBy] = sortOrder
      
      // Execute query based on table name
      let records: any[] = []
      
      const queryParams = {
        where,
        orderBy,
        skip,
        take: limit,
      }
      
      switch (tableName) {
        case "form_records_1":
          records = await prisma.formRecord1.findMany(queryParams)
          break
        case "form_records_2":
          records = await prisma.formRecord2.findMany(queryParams)
          break
        case "form_records_3":
          records = await prisma.formRecord3.findMany(queryParams)
          break
        case "form_records_4":
          records = await prisma.formRecord4.findMany(queryParams)
          break
        case "form_records_5":
          records = await prisma.formRecord5.findMany(queryParams)
          break
        case "form_records_6":
          records = await prisma.formRecord6.findMany(queryParams)
          break
        case "form_records_7":
          records = await prisma.formRecord7.findMany(queryParams)
          break
        case "form_records_8":
          records = await prisma.formRecord8.findMany(queryParams)
          break
        case "form_records_9":
          records = await prisma.formRecord9.findMany(queryParams)
          break
        case "form_records_10":
          records = await prisma.formRecord10.findMany(queryParams)
          break
        case "form_records_11":
          records = await prisma.formRecord11.findMany(queryParams)
          break
        case "form_records_12":
          records = await prisma.formRecord12.findMany(queryParams)
          break
        case "form_records_13":
          records = await prisma.formRecord13.findMany(queryParams)
          break
        case "form_records_14":
          records = await prisma.formRecord14.findMany(queryParams)
          break
        case "form_records_15":
          records = await prisma.formRecord15.findMany(queryParams)
          break
        default:
          throw new Error(`Invalid table name: ${tableName}`)
      }
      
      // Handle search if provided (client-side filtering since we can't easily search JSON)
      if (search && search.trim() !== "") {
        const searchLower = search.toLowerCase()
        records = records.filter(record => {
          // Search in record data
          const recordDataStr = JSON.stringify(record.recordData).toLowerCase()
          if (recordDataStr.includes(searchLower)) return true
          
          // Search in other fields
          if (record.employee_id?.toLowerCase().includes(searchLower)) return true
          if (record.submittedBy?.toLowerCase().includes(searchLower)) return true
          if (record.status?.toLowerCase().includes(searchLower)) return true
          
          return false
        })
      }

      return records.map(record => this.transformRecord(record))
    } catch (error: any) {
      console.error("Database error fetching form records:", error)
      throw new Error(`Failed to fetch form records: ${error?.message}`)
    }
  }

  static async getFormSubmissionCount(formId: string): Promise<number> {
    try {
      const tableName = await this.getFormRecordTable(formId)
      
      let count = 0
      
      switch (tableName) {
        case "form_records_1":
          count = await prisma.formRecord1.count({ where: { formId } })
          break
        case "form_records_2":
          count = await prisma.formRecord2.count({ where: { formId } })
          break
        case "form_records_3":
          count = await prisma.formRecord3.count({ where: { formId } })
          break
        case "form_records_4":
          count = await prisma.formRecord4.count({ where: { formId } })
          break
        case "form_records_5":
          count = await prisma.formRecord5.count({ where: { formId } })
          break
        case "form_records_6":
          count = await prisma.formRecord6.count({ where: { formId } })
          break
        case "form_records_7":
          count = await prisma.formRecord7.count({ where: { formId } })
          break
        case "form_records_8":
          count = await prisma.formRecord8.count({ where: { formId } })
          break
        case "form_records_9":
          count = await prisma.formRecord9.count({ where: { formId } })
          break
        case "form_records_10":
          count = await prisma.formRecord10.count({ where: { formId } })
          break
        case "form_records_11":
          count = await prisma.formRecord11.count({ where: { formId } })
          break
        case "form_records_12":
          count = await prisma.formRecord12.count({ where: { formId } })
          break
        case "form_records_13":
          count = await prisma.formRecord13.count({ where: { formId } })
          break
        case "form_records_14":
          count = await prisma.formRecord14.count({ where: { formId } })
          break
        case "form_records_15":
          count = await prisma.formRecord15.count({ where: { formId } })
          break
        default:
          throw new Error(`Invalid table name: ${tableName}`)
      }
      
      return count
    } catch (error: any) {
      console.error("Database error getting form submission count:", error)
      throw new Error(`Failed to get form submission count: ${error?.message}`)
    }
  }

  static async getFormRecord(recordId: string): Promise<FormRecord | null> {
    try {
      // Try each table until we find the record
      for (let i = 1; i <= 15; i++) {
        const currentTable = `formRecord${i}`
        try {
          const record = await (prisma as any)[currentTable].findUnique({
            where: { id: recordId }
          })
          
          if (record) {
            return this.transformRecord(record)
          }
        } catch (error) {
          // Continue to next table
        }
      }
      
      return null
    } catch (error: any) {
      console.error("Database error fetching form record:", error)
      throw new Error(`Failed to fetch form record: ${error?.message}`)
    }
  }

  static async updateFormRecord(recordId: string, data: Partial<FormRecord>): Promise<FormRecord> {
    try {
      // First, find which table contains this record
      let tableName = ""
      let record = null
      
      // Try each table until we find the record
      for (let i = 1; i <= 15; i++) {
        const currentTable = `formRecord${i}`
        try {
          record = await (prisma as any)[currentTable].findUnique({
            where: { id: recordId },
            select: { id: true, formId: true }
          })
          
          if (record) {
            tableName = `form_records_${i}`
            break
          }
        } catch (error) {
          // Continue to next table
        }
      }
      
      if (!record) {
        throw new Error(`Record not found: ${recordId}`)
      }
      
      // Update the record in the correct table
      const updateData = {
        recordData: data.recordData,
        employee_id: data.employee_id,
        amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
        date: data.date,
        submittedBy: data.submittedBy,
        status: data.status,
        updatedAt: new Date()
      }
      
      let updatedRecord
      
      switch (tableName) {
        case "form_records_1":
          updatedRecord = await prisma.formRecord1.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_2":
          updatedRecord = await prisma.formRecord2.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_3":
          updatedRecord = await prisma.formRecord3.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_4":
          updatedRecord = await prisma.formRecord4.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_5":
          updatedRecord = await prisma.formRecord5.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_6":
          updatedRecord = await prisma.formRecord6.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_7":
          updatedRecord = await prisma.formRecord7.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_8":
          updatedRecord = await prisma.formRecord8.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_9":
          updatedRecord = await prisma.formRecord9.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_10":
          updatedRecord = await prisma.formRecord10.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_11":
          updatedRecord = await prisma.formRecord11.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_12":
          updatedRecord = await prisma.formRecord12.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_13":
          updatedRecord = await prisma.formRecord13.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_14":
          updatedRecord = await prisma.formRecord14.update({
            where: { id: recordId },
            data: updateData
          })
          break
        case "form_records_15":
          updatedRecord = await prisma.formRecord15.update({
            where: { id: recordId },
            data: updateData
          })
          break
        default:
          throw new Error(`Invalid table name: ${tableName}`)
      }

      return this.transformRecord(updatedRecord)
    } catch (error: any) {
      console.error("Database error updating form record:", error)
      throw new Error(`Failed to update form record: ${error?.message}`)
    }
  }

  static async deleteFormRecord(recordId: string): Promise<void> {
    try {
      // First, find which table contains this record
      let tableName = ""
      let record = null
      
      // Try each table until we find the record
      for (let i = 1; i <= 15; i++) {
        const currentTable = `formRecord${i}`
        try {
          record = await (prisma as any)[currentTable].findUnique({
            where: { id: recordId },
            select: { id: true }
          })
          
          if (record) {
            tableName = `form_records_${i}`
            break
          }
        } catch (error) {
          // Continue to next table
        }
      }
      
      if (!record) {
        throw new Error(`Record not found: ${recordId}`)
      }
      
      // Delete the record from the correct table
      switch (tableName) {
        case "form_records_1":
          await prisma.formRecord1.delete({ where: { id: recordId } })
          break
        case "form_records_2":
          await prisma.formRecord2.delete({ where: { id: recordId } })
          break
        case "form_records_3":
          await prisma.formRecord3.delete({ where: { id: recordId } })
          break
        case "form_records_4":
          await prisma.formRecord4.delete({ where: { id: recordId } })
          break
        case "form_records_5":
          await prisma.formRecord5.delete({ where: { id: recordId } })
          break
        case "form_records_6":
          await prisma.formRecord6.delete({ where: { id: recordId } })
          break
        case "form_records_7":
          await prisma.formRecord7.delete({ where: { id: recordId } })
          break
        case "form_records_8":
          await prisma.formRecord8.delete({ where: { id: recordId } })
          break
        case "form_records_9":
          await prisma.formRecord9.delete({ where: { id: recordId } })
          break
        case "form_records_10":
          await prisma.formRecord10.delete({ where: { id: recordId } })
          break
        case "form_records_11":
          await prisma.formRecord11.delete({ where: { id: recordId } })
          break
        case "form_records_12":
          await prisma.formRecord12.delete({ where: { id: recordId } })
          break
        case "form_records_13":
          await prisma.formRecord13.delete({ where: { id: recordId } })
          break
        case "form_records_14":
          await prisma.formRecord14.delete({ where: { id: recordId } })
          break
        case "form_records_15":
          await prisma.formRecord15.delete({ where: { id: recordId } })
          break
        default:
          throw new Error(`Invalid table name: ${tableName}`)
      }
    } catch (error: any) {
      console.error("Database error deleting form record:", error)
      throw new Error(`Failed to delete form record: ${error?.message}`)
    }
  }

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
      const totalSubmissions = await this.getFormSubmissionCount(formId)
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

  // Enhanced relationship methods for the records page with detailed module/form information
  static async getLookupSources(formId: string): Promise<{
    sources: Array<{
      id: string
      name: string
      type: "form" | "module"
      recordCount: number
      description?: string
      moduleName?: string
      moduleId?: string
      breadcrumb: string
      createdAt: Date
      updatedAt: Date
      isPublished?: boolean
      fieldCount?: number
    }>
  }> {
    try {
      console.log("[DatabaseService] Getting detailed lookup sources for form:", formId)

      // Get all lookup fields in this form
      const form = await prisma.form.findUnique({
        where: { id: formId },
        include: {
          sections: {
            include: {
              fields: {
                where: { type: "lookup" },
              },
            },
          },
        },
      })

      if (!form) {
        return { sources: [] }
      }

      const lookupFields = form.sections.flatMap((section) => section.fields)

      const sources: Array<{
        id: string
        name: string
        type: "form" | "module"
        recordCount: number
        description?: string
        moduleName?: string
        moduleId?: string
        breadcrumb: string
        createdAt: Date
        updatedAt: Date
        isPublished?: boolean
        fieldCount?: number
      }> = []

      for (const field of lookupFields) {
        const lookupConfig = field.lookup as any
        if (!lookupConfig?.sourceId) continue

        if (lookupConfig.sourceId.startsWith("form_")) {
          const sourceFormId = lookupConfig.sourceId.replace("form_", "")
          const sourceForm = await prisma.form.findUnique({
            where: { id: sourceFormId },
            include: {
              module: true,
              tableMapping: true,
              _count: {
                select: {
                  sections: true,
                },
              },
              sections: {
                include: {
                  _count: {
                    select: { fields: true },
                  },
                },
              },
            },
          })

          if (sourceForm) {
            const totalFields = sourceForm.sections.reduce((sum, section) => sum + section._count.fields, 0)
            const recordCount = await this.getFormSubmissionCount(sourceFormId)

            sources.push({
              id: sourceForm.id,
              name: sourceForm.name,
              type: "form",
              recordCount,
              description: sourceForm.description || undefined,
              moduleName: sourceForm.module?.name,
              moduleId: sourceForm.module?.id,
              breadcrumb: `${sourceForm.module?.name} > ${sourceForm.name}`,
              createdAt: sourceForm.createdAt,
              updatedAt: sourceForm.updatedAt,
              isPublished: sourceForm.isPublished,
              fieldCount: totalFields,
            })
          }
        } else if (lookupConfig.sourceId.startsWith("module_")) {
          const sourceModuleId = lookupConfig.sourceId.replace("module_", "")
          const sourceModule = await prisma.formModule.findUnique({
            where: { id: sourceModuleId },
            include: {
              forms: {
                include: {
                  tableMapping: true,
                  _count: {
                    select: {
                      sections: true,
                    },
                  },
                  sections: {
                    include: {
                      _count: {
                        select: { fields: true },
                      },
                    },
                  },
                },
              },
            },
          })

          if (sourceModule) {
            let totalRecords = 0
            for (const form of sourceModule.forms) {
              totalRecords += await this.getFormSubmissionCount(form.id)
            }
            
            const totalFields = sourceModule.forms.reduce(
              (sum, form) => sum + form.sections.reduce((sectionSum, section) => sectionSum + section._count.fields, 0),
              0,
            )

            sources.push({
              id: sourceModule.id,
              name: sourceModule.name,
              type: "module",
              recordCount: totalRecords,
              description: sourceModule.description || undefined,
              moduleName: sourceModule.name,
              moduleId: sourceModule.id,
              breadcrumb: `${sourceModule.name} (Module)`,
              createdAt: sourceModule.createdAt,
              updatedAt: sourceModule.updatedAt,
              fieldCount: totalFields,
            })
          }
        }
      }

      // Remove duplicates
      const uniqueSources = sources.filter(
        (source, index, self) => index === self.findIndex((s) => s.id === source.id && s.type === source.type),
      )

      console.log("[DatabaseService] Found detailed lookup sources:", uniqueSources.length)

      return { sources: uniqueSources }
    } catch (error: any) {
      console.error("Database error getting lookup sources:", error)
      return { sources: [] }
    }
  }

  static async getLinkedRecords(formId: string): Promise<{
    linkedForms: Array<{
      id: string
      name: string
      recordCount: number
      description?: string
      moduleName?: string
      moduleId?: string
      breadcrumb: string
      createdAt: Date
      updatedAt: Date
      isPublished?: boolean
      fieldCount?: number
      lookupFieldsCount?: number
    }>
  }> {
    try {
      console.log("[DatabaseService] Getting detailed linked records for form:", formId)

      // Find all forms that have lookup fields pointing to this form
      const formsWithLookups = await prisma.form.findMany({
        include: {
          module: true,
          tableMapping: true,
          sections: {
            include: {
              fields: {
                where: { type: "lookup" },
              },
              _count: {
                select: { fields: true },
              },
            },
          },
        },
      })

      const linkedForms: Array<{
        id: string
        name: string
        recordCount: number
        description?: string
        moduleName?: string
        moduleId?: string
        breadcrumb: string
        createdAt: Date
        updatedAt: Date
        isPublished?: boolean
        fieldCount?: number
        lookupFieldsCount?: number
      }> = []

      for (const form of formsWithLookups) {
        if (form.id === formId) continue // Skip self

        const lookupFieldsToThisForm = form.sections.flatMap((section) =>
          section.fields.filter((field) => {
            const lookupConfig = field.lookup as any
            return lookupConfig?.sourceId === `form_${formId}`
          }),
        )

        if (lookupFieldsToThisForm.length > 0) {
          const totalFields = form.sections.reduce((sum, section) => sum + section._count.fields, 0)
          const recordCount = await this.getFormSubmissionCount(form.id)

          linkedForms.push({
            id: form.id,
            name: form.name,
            recordCount,
            description: form.description || undefined,
            moduleName: form.module?.name,
            moduleId: form.module?.id,
            breadcrumb: `${form.module?.name} > ${form.name}`,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
            isPublished: form.isPublished,
            fieldCount: totalFields,
            lookupFieldsCount: lookupFieldsToThisForm.length,
          })
        }
      }

      console.log("[DatabaseService] Found detailed linked forms:", linkedForms.length)

      return { linkedForms }
    } catch (error: any) {
      console.error("Database error getting linked records:", error)
      return { linkedForms: [] }
    }
  }
}