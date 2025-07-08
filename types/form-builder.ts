export interface FormModule {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  settings: Record<string, any>

  // Hierarchical fields
  parentId?: string | null
  parent?: FormModule | null
  children?: FormModule[]
  moduleType: "master" | "child" | "standard"
  level: number
  path?: string | null
  isActive: boolean
  sortOrder: number

  forms: Form[]
  isPublished?: any
  createdAt: Date
  updatedAt: Date
}

export interface Form {
  id: string
  moduleId: string
  name: string
  description?: string | null
  settings: Record<string, any>
  tableMapping?: {
    id: string
    formId: string
    storageTable: string
  } | null
  tableMapping?: {
    id: string
    formId: string
    storageTable: string
  } | null
  sections: FormSection[]
  isPublished?: boolean
  publishedAt?: Date | null
  formUrl?: string | null
  allowAnonymous: boolean
  requireLogin: boolean
  maxSubmissions?: number | null
  submissionMessage?: string | null
  conditional?: Record<string, any> | null
  styling?: Record<string, any> | null
  recordCount?: number
  createdAt: Date
  updatedAt: Date
  records?: FormRecord[]
}

export interface FormSection {
  id: string
  formId: string
  title: string
  description?: string | null
  order: number
  columns: number
  visible: boolean
  collapsible: boolean
  collapsed: boolean
  conditional?: Record<string, any> | null
  styling?: Record<string, any> | null
  fields: FormField[]
  subforms: any[]
  createdAt: Date
  updatedAt: Date
}

export interface FormField {
  id: string
  sectionId?: string | null
  subformId?: string | null
  type: string
  label: string
  placeholder?: string | null
  description?: string | null
  defaultValue?: string | null
  options: FieldOption[]
  validation: Record<string, any>
  visible: boolean
  readonly: boolean
  width: "full" | "half" | "third" | "quarter"
  order: number
  conditional?: Record<string, any> | null
  styling?: Record<string, any> | null
  properties?: Record<string, any> | null
  formula?: string | null
  rollup?: Record<string, any> | null
  lookup?: {
    sourceId?: string
    sourceType?: "form" | "module" | "static"
    displayField?: string
    valueField?: string
    storeField?: string // What field value to actually store
    multiple?: boolean
    searchable?: boolean
    searchPlaceholder?: string
    fieldMapping?: {
      display: string // Field to show in dropdown
      value: string // Field to use as option value
      store: string // Field value to store in record
      description?: string // Optional description field
    }
  } | null
  // Legacy fields for backward compatibility
  sourceModule?: string | null
  sourceForm?: string | null
  displayField?: string | null
  valueField?: string | null
  multiple?: boolean | null
  searchable?: boolean | null
  filters?: string | Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface FieldOption {
  id: string
  label: string
  value: string
  order?: number
}

export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  message?: string
  patternMessage?: string
}

export interface FieldStyling {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  fontSize?: string
  fontWeight?: string
  padding?: string
  margin?: string
}

export interface SectionStyling {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  padding?: string
  margin?: string
}

export interface FormStyling {
  backgroundColor?: string
  textColor?: string
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
}

export interface FieldProperties {
  accept?: string
  multiple?: boolean
  rows?: number
  cols?: number
  min?: number
  max?: number
  step?: number
}

export interface ConditionalLogic {
  field: string
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than"
  value: string
}

export interface LookupConfig {
  sourceId?: string
  displayField?: string
  valueField?: string
  multiple?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  filters?: Record<string, any>
}

  id: string
  formId: string
  form?: Form
  recordData: Record<string, any>
  employee_id?: string | null
  amount?: number | null
  date?: Date | null
  employee_id?: string | null
  amount?: number | null
  date?: Date | null
  submittedBy?: string | null
  submittedAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  status: string
  status: string
  createdAt: Date
  updatedAt: Date
}

// Specialized record types for different tables
export interface FormRecord1 extends FormRecord {}
export interface FormRecord2 extends FormRecord {}
export interface FormRecord3 extends FormRecord {}
export interface FormRecord4 extends FormRecord {}
export interface FormRecord5 extends FormRecord {}
export interface FormRecord6 extends FormRecord {}
export interface FormRecord7 extends FormRecord {}
export interface FormRecord8 extends FormRecord {}
export interface FormRecord9 extends FormRecord {}
export interface FormRecord10 extends FormRecord {}
export interface FormRecord11 extends FormRecord {}
export interface FormRecord12 extends FormRecord {}
export interface FormRecord13 extends FormRecord {}
export interface FormRecord14 extends FormRecord {}
export interface FormRecord15 extends FormRecord {}

export interface FormTableMapping {
  id: string
  formId: string
  storageTable: string
  createdAt: Date
  updatedAt: Date
}

// Specialized record types for different tables
export interface FormRecord1 extends FormRecord {}
export interface FormRecord2 extends FormRecord {}
export interface FormRecord3 extends FormRecord {}
export interface FormRecord4 extends FormRecord {}
export interface FormRecord5 extends FormRecord {}
export interface FormRecord6 extends FormRecord {}
export interface FormRecord7 extends FormRecord {}
export interface FormRecord8 extends FormRecord {}
export interface FormRecord9 extends FormRecord {}
export interface FormRecord10 extends FormRecord {}
export interface FormRecord11 extends FormRecord {}
export interface FormRecord12 extends FormRecord {}
export interface FormRecord13 extends FormRecord {}
export interface FormRecord14 extends FormRecord {}
export interface FormRecord15 extends FormRecord {}

export interface FormTableMapping {
  id: string
  formId: string
  storageTable: string
  createdAt: Date
  updatedAt: Date
}

export interface FormEvent {
  id: string
  formId: string
  eventType: string
  payload: Record<string, any>
  sessionId?: string | null
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: Date
}

export interface FieldType {
  id: string
  name: string
  label: string
  category: string
  icon: string
  description: string
  defaultProps: Record<string, any>
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DraggedItem {
  id: string
  type: string
  index?: number
  sectionId?: string
  subformId?: string
}

export interface DragItem {
  id: string
  type: string
  fieldType?: string
  field?: FormField
  section?: FormSection
}

export interface DropResult {
  draggedId: string
  targetId?: string
  position: "before" | "after" | "inside"
}

export type FieldWidth = "full" | "half" | "third" | "quarter"

export interface LookupSource {
  id: string
  name: string
  type: "static" | "module" | "form" | "api"
  description?: string
  recordCount?: number
  icon?: string
}

export interface LookupOption {
  value: string
  label: string
  data?: Record<string, any>
}

export const ItemTypes = {
  PALETTE_FIELD: "palette_field",
  FIELD: "field",
  SECTION: "section",
}

// Additional types for hierarchical module management
export interface ModuleHierarchyNode extends FormModule {
  depth: number
  hasChildren: boolean
  isExpanded?: boolean
  childCount: number
  formCount: number
  totalRecords: number
}

export interface ModuleBreadcrumb {
  id: string
  name: string
  path: string
  level: number
}

export interface ModuleTreeItem {
  module: FormModule
  children: ModuleTreeItem[]
  expanded: boolean
}

export interface HierarchicalModuleStats {
  totalModules: number
  masterModules: number
  childModules: number
  standardModules: number
  maxDepth: number
  totalForms: number
  totalRecords: number
}

// Module management actions
export type ModuleAction = 
  | { type: "CREATE_CHILD"; parentId: string; moduleData: Partial<FormModule> }
  | { type: "MOVE_MODULE"; moduleId: string; newParentId?: string }
  | { type: "REORDER_MODULES"; moduleIds: string[]; parentId?: string }
  | { type: "CONVERT_TO_MASTER"; moduleId: string }
  | { type: "CONVERT_TO_CHILD"; moduleId: string; parentId: string }
  | { type: "DELETE_MODULE"; moduleId: string; cascadeChildren?: boolean }

// Enhanced lookup configuration for hierarchical modules
export interface HierarchicalLookupConfig extends LookupConfig {
  includeChildModules?: boolean
  moduleFilter?: {
    moduleType?: ("master" | "child" | "standard")[]
    level?: number
    parentId?: string
  }
}

// Module permissions and access control
export interface ModulePermissions {
  moduleId: string
  userId?: string
  roleId?: string
  permissions: {
    read: boolean
    write: boolean
    delete: boolean
    manageChildren: boolean
    moveModule: boolean
  }
  inherited: boolean
  inheritedFrom?: string
}

// Module settings specific to hierarchy
export interface HierarchicalModuleSettings {
  allowChildCreation: boolean
  maxChildDepth?: number
  childModuleTemplate?: Partial<FormModule>
  inheritPermissions: boolean
  cascadeSettings: boolean
  displayMode: "tree" | "flat" | "breadcrumb"
  sortChildrenBy: "name" | "createdAt" | "sortOrder" | "formCount"
  sortDirection: "asc" | "desc"
}

// Legacy interfaces for backward compatibility
export interface Subform {
  id: string
  sectionId: string
  name: string
  order: number
  fields: FormField[]
  records: SubformRecord[]
  createdAt: Date
  updatedAt: Date
}

export interface SubformRecord {
  id: string
  subformId: string
  recordData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface LookupFieldRelation {
  id: string
  lookupSourceId: string
  formFieldId: string
  formId: string
  moduleId: string
  displayField?: string
  valueField?: string
  multiple?: boolean
  searchable?: boolean
  filters: Record<string, any>
  createdAt: Date
  updatedAt: Date
}