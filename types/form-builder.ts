export interface FormModule {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  settings: Record<string, any>
  forms: Form[]
  createdAt: Date
  updatedAt: Date
}

export interface Form {
  id: string
  moduleId: string
  name: string
  description?: string | null
  settings: Record<string, any>
  sections: FormSection[]
  isPublished: boolean
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

export interface FormRecord {
  id: string
  formId: string
  form?: Form
  recordData: Record<string, any>
  submittedBy?: string | null
  submittedAt: Date
  ipAddress?: string | null
  userAgent?: string | null
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
