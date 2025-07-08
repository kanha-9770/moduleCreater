import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"

export class DatabaseService {
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

  // Create a form record in the appropriate table
  static async createFormRecord(formId: string, recordData: any, submittedBy?: string, employeeId?: string, amount?: number, date?: Date): Promise<any> {
    const tableName = await this.getFormRecordTable(formId)
    
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
    
    // Dynamic query based on table name
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
    
    return record
  }

  // Get form records from the appropriate table
  static async getFormRecords(formId: string, options: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    employeeId?: string
    dateFrom?: Date
    dateTo?: Date
  } = {}): Promise<any[]> {
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
    } = options
    
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
    
    return records
  }

  // Get form submission count
  static async getFormSubmissionCount(formId: string): Promise<number> {
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
  }

  // Update a form record
  static async updateFormRecord(recordId: string, updates: any): Promise<any> {
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
        console.error(`Error checking table ${currentTable}:`, error)
      }
    }
    
    if (!record) {
      throw new Error(`Record not found: ${recordId}`)
    }
    
    // Update the record in the correct table
    const updateData = {
      ...updates,
      updatedAt: new Date()
    }
    
    switch (tableName) {
      case "form_records_1":
        return prisma.formRecord1.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_2":
        return prisma.formRecord2.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_3":
        return prisma.formRecord3.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_4":
        return prisma.formRecord4.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_5":
        return prisma.formRecord5.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_6":
        return prisma.formRecord6.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_7":
        return prisma.formRecord7.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_8":
        return prisma.formRecord8.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_9":
        return prisma.formRecord9.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_10":
        return prisma.formRecord10.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_11":
        return prisma.formRecord11.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_12":
        return prisma.formRecord12.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_13":
        return prisma.formRecord13.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_14":
        return prisma.formRecord14.update({
          where: { id: recordId },
          data: updateData
        })
      case "form_records_15":
        return prisma.formRecord15.update({
          where: { id: recordId },
          data: updateData
        })
      default:
        throw new Error(`Invalid table name: ${tableName}`)
    }
  }

  // Delete a form record
  static async deleteFormRecord(recordId: string): Promise<void> {
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
        console.error(`Error checking table ${currentTable}:`, error)
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
  }

  // Get a specific form record
  static async getFormRecord(recordId: string): Promise<any> {
    // Try each table until we find the record
    for (let i = 1; i <= 15; i++) {
      const currentTable = `formRecord${i}`
      try {
        const record = await (prisma as any)[currentTable].findUnique({
          where: { id: recordId }
        })
        
        if (record) {
          return record
        }
      } catch (error) {
        console.error(`Error checking table ${currentTable}:`, error)
      }
    }
    
    throw new Error(`Record not found: ${recordId}`)
  }

  // Create a form
  static async createForm(data: {
    moduleId: string
    name: string
    description?: string
  }): Promise<any> {
    const form = await prisma.form.create({
      data: {
        moduleId: data.moduleId,
        name: data.name,
        description: data.description,
      },
    })
    
    // The form_table_mapping will be created automatically via database trigger
    
    return form
  }

  // Get a form with its sections and fields
  static async getForm(formId: string): Promise<any> {
    return prisma.form.findUnique({
      where: { id: formId },
      include: {
        module: true,
        tableMapping: true,
        sections: {
          orderBy: { order: "asc" },
          include: {
            fields: {
              orderBy: { order: "asc" },
            },
            subforms: {
              orderBy: { order: "asc" },
              include: {
                fields: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    })
  }

  // Update a form
  static async updateForm(formId: string, data: any): Promise<any> {
    return prisma.form.update({
      where: { id: formId },
      data,
    })
  }

  // Delete a form
  static async deleteForm(formId: string): Promise<void> {
    await prisma.form.delete({
      where: { id: formId },
    })
  }

  // Publish a form
  static async publishForm(formId: string, publishData: any): Promise<any> {
    return prisma.form.update({
      where: { id: formId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        allowAnonymous: publishData.allowAnonymous,
        requireLogin: publishData.requireLogin,
        maxSubmissions: publishData.maxSubmissions,
        submissionMessage: publishData.submissionMessage,
        formUrl: `/form/${formId}`,
      },
    })
  }

  // Unpublish a form
  static async unpublishForm(formId: string): Promise<any> {
    return prisma.form.update({
      where: { id: formId },
      data: {
        isPublished: false,
        publishedAt: null,
      },
    })
  }

  // Create a section
  static async createSection(data: any): Promise<any> {
    return prisma.formSection.create({
      data,
    })
  }

  // Update a section
  static async updateSection(sectionId: string, data: any): Promise<any> {
    return prisma.formSection.update({
      where: { id: sectionId },
      data,
    })
  }

  // Delete a section with cleanup
  static async deleteSectionWithCleanup(sectionId: string): Promise<void> {
    await prisma.formSection.delete({
      where: { id: sectionId },
    })
  }

  // Create a field
  static async createField(data: any): Promise<any> {
    return prisma.formField.create({
      data,
    })
  }

  // Update a field
  static async updateField(fieldId: string, data: any): Promise<any> {
    return prisma.formField.update({
      where: { id: fieldId },
      data,
    })
  }

  // Delete a field
  static async deleteField(fieldId: string): Promise<void> {
    await prisma.formField.delete({
      where: { id: fieldId },
    })
  }

  // Get fields for a section
  static async getFields(sectionId: string): Promise<any[]> {
    return prisma.formField.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    })
  }

  // Get field types
  static async getFieldTypes(): Promise<any[]> {
    return prisma.fieldType.findMany({
      where: { active: true },
      orderBy: { category: "asc" },
    })
  }

  // Seed field types
  static async seedFieldTypes(): Promise<void> {
    const fieldTypesData = [
      {
        name: "text",
        label: "Text Input",
        category: "basic",
        icon: "Type",
        description: "Single line text input",
        defaultProps: {},
      },
      {
        name: "textarea",
        label: "Text Area",
        category: "basic",
        icon: "AlignLeft",
        description: "Multi-line text input",
        defaultProps: { rows: 3 },
      },
      {
        name: "number",
        label: "Number",
        category: "basic",
        icon: "Hash",
        description: "Numeric input field",
        defaultProps: {},
      },
      {
        name: "email",
        label: "Email",
        category: "basic",
        icon: "Mail",
        description: "Email address input",
        defaultProps: { validation: { email: true } },
      },
      {
        name: "phone",
        label: "Phone",
        category: "basic",
        icon: "Phone",
        description: "Phone number input",
        defaultProps: { validation: { phone: true } },
      },
      {
        name: "date",
        label: "Date",
        category: "basic",
        icon: "Calendar",
        description: "Date picker field",
        defaultProps: {},
      },
      {
        name: "checkbox",
        label: "Checkbox",
        category: "choice",
        icon: "CheckSquare",
        description: "Single checkbox",
        defaultProps: {},
      },
      {
        name: "radio",
        label: "Radio Buttons",
        category: "choice",
        icon: "Radio",
        description: "Multiple choice (single select)",
        defaultProps: { options: [{ id: "opt1", label: "Option 1", value: "option1" }] },
      },
      {
        name: "select",
        label: "Dropdown",
        category: "choice",
        icon: "ChevronDown",
        description: "Dropdown select list",
        defaultProps: { options: [{ id: "opt1", label: "Option 1", value: "option1" }] },
      },
      {
        name: "file",
        label: "File Upload",
        category: "advanced",
        icon: "Upload",
        description: "File upload field",
        defaultProps: { multiple: false },
      },
      {
        name: "lookup",
        label: "Lookup",
        category: "advanced",
        icon: "Search",
        description: "Reference data from other sources",
        defaultProps: {},
      },
      {
        name: "formula",
        label: "Formula",
        category: "advanced",
        icon: "Calculator",
        description: "Calculated field based on other inputs",
        defaultProps: {},
      },
      {
        name: "rollup",
        label: "Rollup",
        category: "advanced",
        icon: "Database",
        description: "Aggregated value from related records",
        defaultProps: {},
      },
    ]

    for (const typeData of fieldTypesData) {
      await this.upsertFieldType({
        name: typeData.name,
        label: typeData.label,
        category: typeData.category,
        icon: typeData.icon,
        description: typeData.description,
        defaultProps: typeData.defaultProps,
        active: true,
      })
    }
  }

  // Upsert a field type
  static async upsertFieldType(data: any): Promise<any> {
    return prisma.fieldType.upsert({
      where: { name: data.name },
      update: data,
      create: data,
    })
  }

  // Track form event
  static async trackFormEvent(
    formId: string,
    eventType: string,
    payload: any,
    sessionId?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<any> {
    return prisma.formEvent.create({
      data: {
        formId,
        eventType,
        payload,
        sessionId,
        userAgent,
        ipAddress,
      },
    })
  }

  // Get form analytics
  static async getFormAnalytics(formId: string): Promise<any> {
    const tableName = await this.getFormRecordTable(formId)
    
    // Get total views
    const viewEvents = await prisma.formEvent.count({
      where: {
        formId,
        eventType: "view",
      },
    })

    // Get total submissions based on the correct table
    let submissionCount = 0
    
    switch (tableName) {
      case "form_records_1":
        submissionCount = await prisma.formRecord1.count({ where: { formId } })
        break
      case "form_records_2":
        submissionCount = await prisma.formRecord2.count({ where: { formId } })
        break
      case "form_records_3":
        submissionCount = await prisma.formRecord3.count({ where: { formId } })
        break
      case "form_records_4":
        submissionCount = await prisma.formRecord4.count({ where: { formId } })
        break
      case "form_records_5":
        submissionCount = await prisma.formRecord5.count({ where: { formId } })
        break
      case "form_records_6":
        submissionCount = await prisma.formRecord6.count({ where: { formId } })
        break
      case "form_records_7":
        submissionCount = await prisma.formRecord7.count({ where: { formId } })
        break
      case "form_records_8":
        submissionCount = await prisma.formRecord8.count({ where: { formId } })
        break
      case "form_records_9":
        submissionCount = await prisma.formRecord9.count({ where: { formId } })
        break
      case "form_records_10":
        submissionCount = await prisma.formRecord10.count({ where: { formId } })
        break
      case "form_records_11":
        submissionCount = await prisma.formRecord11.count({ where: { formId } })
        break
      case "form_records_12":
        submissionCount = await prisma.formRecord12.count({ where: { formId } })
        break
      case "form_records_13":
        submissionCount = await prisma.formRecord13.count({ where: { formId } })
        break
      case "form_records_14":
        submissionCount = await prisma.formRecord14.count({ where: { formId } })
        break
      case "form_records_15":
        submissionCount = await prisma.formRecord15.count({ where: { formId } })
        break
      default:
        throw new Error(`Invalid table name: ${tableName}`)
    }

    // Calculate conversion rate
    const conversionRate = viewEvents > 0 ? (submissionCount / viewEvents) * 100 : 0

    // Get recent events
    const events = await prisma.formEvent.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return {
      totalViews: viewEvents,
      totalSubmissions: submissionCount,
      conversionRate,
      events,
    }
  }

  // Create a module
  static async createModule(data: {
    name: string
    description?: string
    parentId?: string
    moduleType?: string
    icon?: string
    color?: string
  }): Promise<any> {
    return prisma.formModule.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        moduleType: data.moduleType || "standard",
        icon: data.icon,
        color: data.color,
      },
    })
  }

  // Get a module with its forms
  static async getModule(moduleId: string): Promise<any> {
    return prisma.formModule.findUnique({
      where: { id: moduleId },
      include: {
        forms: {
          include: {
            tableMapping: true,
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
  }

  // Update a module
  static async updateModule(moduleId: string, data: any): Promise<any> {
    return prisma.formModule.update({
      where: { id: moduleId },
      data,
    })
  }

  // Delete a module
  static async deleteModule(moduleId: string): Promise<void> {
    await prisma.formModule.delete({
      where: { id: moduleId },
    })
  }

  // Move a module
  static async moveModule(moduleId: string, parentId?: string): Promise<any> {
    return prisma.formModule.update({
      where: { id: moduleId },
      data: {
        parentId: parentId || null,
      },
    })
  }

  // Get module hierarchy
  static async getModuleHierarchy(): Promise<any[]> {
    const modules = await prisma.formModule.findMany({
      include: {
        forms: {
          select: {
            id: true,
            name: true,
            description: true,
            isPublished: true,
            tableMapping: true,
          },
        },
      },
      orderBy: [
        { level: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    })

    // Add record counts to forms
    for (const module of modules) {
      for (const form of module.forms) {
        form.recordCount = await this.getFormSubmissionCount(form.id)
      }
    }

    // Build the hierarchy
    const moduleMap = new Map()
    const rootModules = []

    // First pass: create a map of all modules
    modules.forEach(module => {
      moduleMap.set(module.id, { ...module, children: [] })
    })

    // Second pass: build the hierarchy
    modules.forEach(module => {
      const moduleWithChildren = moduleMap.get(module.id)
      
      if (module.parentId && moduleMap.has(module.parentId)) {
        const parent = moduleMap.get(module.parentId)
        parent.children.push(moduleWithChildren)
      } else {
        rootModules.push(moduleWithChildren)
      }
    })

    return rootModules
  }

  // Get lookup sources
  static async getLookupSources(formId: string): Promise<any> {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        module: true,
      },
    })

    if (!form) {
      throw new Error(`Form not found: ${formId}`)
    }

    const sources = await prisma.lookupSource.findMany({
      where: {
        active: true,
      },
      include: {
        sourceModule: true,
        sourceForm: true,
      },
    })

    return {
      sources,
      currentForm: form,
      currentModule: form.module,
    }
  }

  // Get linked records
  static async getLinkedRecords(formId: string): Promise<any> {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        module: true,
      },
    })

    if (!form) {
      throw new Error(`Form not found: ${formId}`)
    }

    const linkedForms = await prisma.form.findMany({
      where: {
        moduleId: form.moduleId,
        id: { not: formId },
      },
      include: {
        tableMapping: true,
      },
    })

    return {
      linkedForms,
      currentForm: form,
      currentModule: form.module,
    }
  }
}