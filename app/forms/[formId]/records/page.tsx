"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Search,
  Download,
  Eye,
  Calendar,
  Users,
  FileText,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TableIcon,
  TimerIcon as Timeline,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home,
  Folder,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Mail,
  Hash,
  Type,
  CalendarDays,
  Link,
  Upload,
  CheckSquare,
  Radio,
  ChevronDown,
  Grid3X3,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Form, FormRecord, FormModule, FormField } from "@/types/form-builder"

type RecordsPageProps = {}

interface StatsData {
  totalRecords: number
  todayRecords: number
  weekRecords: number
  monthRecords: number
}

interface EnhancedLookupSource {
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
}

interface EnhancedLinkedForm {
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
}

interface ProcessedFieldData {
  fieldId: string
  fieldLabel: string
  fieldType: string
  value: any
  displayValue: string
  icon: string
  order: number
}

interface EnhancedFormRecord extends FormRecord {
  processedData: ProcessedFieldData[]
}

export default function RecordsPage({}: RecordsPageProps) {
  const params = useParams()
  const formId = params.formId as string

  // State management
  const [module, setModule] = useState<FormModule | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [records, setRecords] = useState<EnhancedFormRecord[]>([])
  const [lookupSources, setLookupSources] = useState<EnhancedLookupSource[]>([])
  const [linkedForms, setLinkedForms] = useState<EnhancedLinkedForm[]>([])
  const [allFormFields, setAllFormFields] = useState<FormField[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalRecords: 0,
    todayRecords: 0,
    weekRecords: 0,
    monthRecords: 0,
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<EnhancedFormRecord | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "timeline" | "excel">("excel")
  const [activeTab, setActiveTab] = useState("records")

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("submittedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const recordsPerPage = 20

  // Helper function to get field icon
  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case "text":
        return Type
      case "email":
        return Mail
      case "number":
        return Hash
      case "date":
      case "datetime":
        return CalendarDays
      case "checkbox":
        return CheckSquare
      case "radio":
        return Radio
      case "select":
        return ChevronDown
      case "file":
        return Upload
      case "lookup":
        return Link
      case "textarea":
        return FileText
      case "tel":
        return Hash
      default:
        return Type
    }
  }

  // Enhanced helper function to format field values based on type
  const formatFieldValue = (fieldType: string, value: any): string => {
    if (value === null || value === undefined) return ""
    if (value === "") return ""

    switch (fieldType) {
      case "date":
      case "datetime":
        if (value) {
          try {
            const date = new Date(value)
            return date.toLocaleDateString()
          } catch {
            return String(value)
          }
        }
        return ""

      case "email":
      case "tel":
      case "text":
      case "textarea":
        return String(value)

      case "number":
        if (typeof value === "number") {
          return value.toLocaleString()
        }
        if (typeof value === "string" && !isNaN(Number(value))) {
          return Number(value).toLocaleString()
        }
        return String(value)

      case "checkbox":
      case "switch":
        if (typeof value === "boolean") {
          return value ? "✓ Yes" : "✗ No"
        }
        if (typeof value === "string") {
          return value.toLowerCase() === "true" || value === "1" ? "✓ Yes" : "✗ No"
        }
        return value ? "✓ Yes" : "✗ No"

      case "lookup":
        return String(value)

      case "file":
        if (typeof value === "object" && value !== null) {
          if (value.name) return String(value.name)
          if (Array.isArray(value)) {
            return `${value.length} file(s)`
          }
          if (value.files && Array.isArray(value.files)) {
            return `${value.files.length} file(s)`
          }
        }
        return String(value)

      case "radio":
      case "select":
        return String(value)

      default:
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(value).substring(0, 50) + "..."
        }
        return String(value)
    }
  }

  // Process record data to extract field values properly
  const processRecordData = (record: FormRecord, formFields: FormField[]): EnhancedFormRecord => {
    console.log("Processing record:", record.id, "with data:", record.recordData)

    const processedData: ProcessedFieldData[] = []

    // Create field lookup maps
    const fieldById = new Map<string, FormField>()
    const fieldByLabel = new Map<string, FormField>()

    formFields.forEach((field, index) => {
      fieldById.set(field.id, field)
      fieldByLabel.set(field.label.toLowerCase(), field)
      field.order = field.order || index
    })

    if (record.recordData && typeof record.recordData === "object") {
      // Process each field in the record data
      Object.entries(record.recordData).forEach(([fieldKey, fieldData]) => {
        console.log("Processing field:", fieldKey, fieldData)

        // The record data structure shows that each field contains metadata
        if (typeof fieldData === "object" && fieldData !== null) {
          const fieldInfo = fieldData as any

          // Try to find the form field definition
          let formField = fieldById.get(fieldKey)
          if (!formField) {
            // Try to find by label
            const label = fieldInfo.label?.toLowerCase()
            if (label) {
              formField = fieldByLabel.get(label)
            }
          }

          const displayValue = formatFieldValue(fieldInfo.type || "text", fieldInfo.value)

          processedData.push({
            fieldId: fieldKey,
            fieldLabel: fieldInfo.label || fieldKey,
            fieldType: fieldInfo.type || "text",
            value: fieldInfo.value,
            displayValue: displayValue,
            icon: fieldInfo.type || "text",
            order: formField?.order || 999,
          })
        }
      })
    }

    // Sort by field order
    processedData.sort((a, b) => a.order - b.order)

    console.log("Processed data:", processedData)

    return {
      ...record,
      processedData,
    }
  }

  // Fetch form data with module information
  const fetchForm = async () => {
    try {
      console.log("Fetching form data for:", formId)
      const response = await fetch(`/api/forms/${formId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch form: ${response.status}`)
      }
      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error("Invalid form data received")
      }

      console.log("Form data received:", data.data.name, "with sections:", data.data.sections?.length)
      setForm(data.data)

      // Extract all form fields
      const allFields: FormField[] = []
      if (data.data.sections) {
        data.data.sections.forEach((section: any) => {
          if (section.fields) {
            allFields.push(...section.fields)
          }
        })
      }
      setAllFormFields(allFields)
      console.log("All form fields extracted:", allFields.length)

      // Fetch module information if moduleId exists
      if (data.data.moduleId) {
        try {
          console.log("Fetching module data for:", data.data.moduleId)
          const moduleResponse = await fetch(`/api/modules/${data.data.moduleId}`)
          if (moduleResponse.ok) {
            const moduleData = await moduleResponse.json()
            if (moduleData.success && moduleData.data) {
              console.log("Module data received:", moduleData.data.name)
              setModule(moduleData.data)
            }
          }
        } catch (moduleError) {
          console.error("Error fetching module:", moduleError)
        }
      }
    } catch (err) {
      console.error("Error fetching form:", err)
      setError("Failed to load form data")
    }
  }

  // Fetch records with enhanced formatting
  const fetchRecords = async () => {
    try {
      console.log("Fetching records for form:", formId)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        sortBy,
        sortOrder,
      })

      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/forms/${formId}/records?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch records: ${response.status}`)
      }
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch records")
      }

      console.log("Records data received:", data.records?.length || 0, "records")

      // Process records with field data
      const processedRecords = (data.records || []).map((record: FormRecord) =>
        processRecordData(record, allFormFields),
      )

      console.log("Processed records:", processedRecords.length)
      setRecords(processedRecords)
      setTotalPages(Math.ceil((data.total || 0) / recordsPerPage))

      // Calculate stats
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      const allRecords = data.records || []
      setStats({
        totalRecords: data.total || 0,
        todayRecords: allRecords.filter((r: FormRecord) => new Date(r.submittedAt) >= today).length,
        weekRecords: allRecords.filter((r: FormRecord) => new Date(r.submittedAt) >= weekAgo).length,
        monthRecords: allRecords.filter((r: FormRecord) => new Date(r.submittedAt) >= monthAgo).length,
      })
    } catch (err) {
      console.error("Error fetching records:", err)
      setError("Failed to load records")
    }
  }

  // Fetch enhanced lookup sources
  const fetchLookupSources = async () => {
    try {
      console.log("Fetching enhanced lookup sources for form:", formId)
      const response = await fetch(`/api/forms/${formId}/lookup-sources`)
      if (response.ok) {
        const data = await response.json()
        console.log("Enhanced lookup sources received:", data.sources?.length || 0)
        setLookupSources(data.sources || [])
      }
    } catch (err) {
      console.error("Error fetching lookup sources:", err)
      setLookupSources([])
    }
  }

  // Fetch enhanced linked records
  const fetchLinkedRecords = async () => {
    try {
      console.log("Fetching enhanced linked records for form:", formId)
      const response = await fetch(`/api/forms/${formId}/linked-records`)
      if (response.ok) {
        const data = await response.json()
        console.log("Enhanced linked records received:", data.linkedForms?.length || 0)
        setLinkedForms(data.linkedForms || [])
      }
    } catch (err) {
      console.error("Error fetching linked records:", err)
      setLinkedForms([])
    }
  }

  // Load all data
  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      await fetchForm()
    } catch (err) {
      console.error("Error loading form data:", err)
      setError("Failed to load form data")
      setLoading(false)
    }
  }

  // Load records and relationships after form is loaded
  const loadRecordsAndRelationships = async () => {
    if (!form || allFormFields.length === 0) return

    try {
      console.log("Loading records and relationships...")
      await Promise.all([fetchRecords(), fetchLookupSources(), fetchLinkedRecords()])
      console.log("All data loaded successfully")
    } catch (err) {
      console.error("Error loading records and relationships:", err)
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    if (formId) {
      console.log("Starting data load for form:", formId)
      loadData()
    }
  }, [formId])

  useEffect(() => {
    if (form && allFormFields.length > 0) {
      console.log("Form and fields loaded, loading records and relationships...")
      loadRecordsAndRelationships()
    }
  }, [form, allFormFields])

  // Separate effect for pagination and filtering
  useEffect(() => {
    if (form && allFormFields.length > 0 && !loading) {
      console.log("Reloading records due to filter/pagination change")
      fetchRecords()
    }
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

  // Handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setCurrentPage(1)
  }

  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/forms/${formId}/export?format=${format}`)
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${form?.name || "form"}-records.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Export error:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return CheckCircle
      case "draft":
        return AlertCircle
      case "processing":
        return Clock
      default:
        return XCircle
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Get all unique field labels for table headers
  const getAllFieldLabels = () => {
    const fieldLabels = new Set<string>()
    records.forEach((record) => {
      record.processedData.forEach((field) => {
        fieldLabels.add(field.fieldLabel)
      })
    })
    return Array.from(fieldLabels).sort()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-96 mb-2" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Form not found or still loading...</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {module && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/modules/${module.id}`} className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {module.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbLink href={`/forms/${form.id}`} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {form.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Records
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{form.name} Records</h1>
          <p className="text-muted-foreground">
            Manage and view form submissions {module && `from ${module.name} module`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayRecords}</div>
            <p className="text-xs text-muted-foreground">Submitted today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.weekRecords}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.monthRecords}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Records ({stats.totalRecords})
          </TabsTrigger>
          <TabsTrigger value="lookup-sources" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Lookup Sources ({lookupSources.length})
          </TabsTrigger>
          <TabsTrigger value="linked-records" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Linked Records ({linkedForms.length})
          </TabsTrigger>
        </TabsList>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Records</CardTitle>
                  <CardDescription>All submissions for this form</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "excel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("excel")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Excel View
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <TableIcon className="h-4 w-4" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === "timeline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("timeline")}
                  >
                    <Timeline className="h-4 w-4" />
                    Timeline
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {viewMode === "excel" ? (
                <div className="space-y-4">
                  {/* Excel-like Table */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px] sticky left-0 bg-gray-50 z-10">
                              Record ID
                            </th>
                            <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                              Submitted At
                            </th>
                            <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]">
                              Submitted By
                            </th>
                            <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">
                              Status
                            </th>
                            {getAllFieldLabels().map((fieldLabel) => (
                              <th
                                key={fieldLabel}
                                className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[150px]"
                              >
                                {fieldLabel}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record, recordIndex) => {
                            // Create a map of field values for this record
                            const fieldValueMap = new Map<string, string>()
                            record.processedData.forEach((field) => {
                              fieldValueMap.set(field.fieldLabel, field.displayValue)
                            })

                            return (
                              <tr
                                key={record.id}
                                className={cn(
                                  "border-b hover:bg-blue-50 transition-colors",
                                  recordIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                                )}
                              >
                                <td className="border-r border-gray-200 px-4 py-3 text-sm font-mono sticky left-0 bg-inherit z-10">
                                  #{record.id.slice(-8)}
                                </td>
                                <td className="border-r border-gray-200 px-4 py-3 text-sm">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {new Date(record.submittedAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(record.submittedAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </td>
                                <td className="border-r border-gray-200 px-4 py-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{record.submittedBy || "Anonymous"}</span>
                                  </div>
                                </td>
                                <td className="border-r border-gray-200 px-4 py-3 text-sm">
                                  <Badge className={cn("text-xs", getStatusColor(record.status || "submitted"))}>
                                    {record.status || "submitted"}
                                  </Badge>
                                </td>
                                {getAllFieldLabels().map((fieldLabel) => {
                                  const value = fieldValueMap.get(fieldLabel) || ""
                                  return (
                                    <td
                                      key={fieldLabel}
                                      className="border-r border-gray-200 px-4 py-3 text-sm"
                                      title={value}
                                    >
                                      <div className="max-w-[200px] truncate font-medium">
                                        {value || <span className="text-gray-400 italic">—</span>}
                                      </div>
                                    </td>
                                  )
                                })}
                                <td className="px-4 py-3 text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedRecord(record)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {records.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Grid3X3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No records found</h3>
                      <p>No form submissions match your current filters.</p>
                    </div>
                  )}
                </div>
              ) : viewMode === "table" ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <Button variant="ghost" onClick={() => handleSort("id")} className="h-auto p-0 font-semibold">
                            Record {renderSortIcon("id")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("submittedAt")}
                            className="h-auto p-0 font-semibold"
                          >
                            Submitted {renderSortIcon("submittedAt")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort("submittedBy")}
                            className="h-auto p-0 font-semibold"
                          >
                            Submitted By {renderSortIcon("submittedBy")}
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Preview</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">#{record.id.slice(-8)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{new Date(record.submittedAt).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(record.submittedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {record.submittedBy || "Anonymous"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border", getStatusColor(record.status || "submitted"))}>
                              {record.status || "submitted"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="space-y-1">
                              {record.processedData.length > 0 ? (
                                record.processedData.slice(0, 2).map((field, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground truncate">
                                      {field.fieldLabel}:
                                    </span>
                                    <span className="truncate font-medium">{field.displayValue}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">No data available</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {records.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No records found</h3>
                      <p>No form submissions match your current filters.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timeline View */}
                  <div className="relative">
                    {records.map((record, index) => {
                      const StatusIcon = getStatusIcon(record.status || "submitted")
                      return (
                        <div key={record.id} className="relative flex items-start space-x-6 pb-8">
                          {/* Timeline line */}
                          {index < records.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-full bg-gradient-to-b from-border to-transparent" />
                          )}

                          {/* Timeline dot with status */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background shadow-sm",
                                record.status === "submitted"
                                  ? "border-green-500 text-green-500 bg-green-50"
                                  : record.status === "draft"
                                    ? "border-yellow-500 text-yellow-500 bg-yellow-50"
                                    : "border-blue-500 text-blue-500 bg-blue-50",
                              )}
                            >
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground font-medium">
                              {new Date(record.submittedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          {/* Timeline content */}
                          <div className="flex-1 min-w-0">
                            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge className={cn("border", getStatusColor(record.status || "submitted"))}>
                                      {record.status || "submitted"}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(record.submittedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedRecord(record)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="space-y-1">
                                  <h3 className="font-semibold text-lg">Record #{record.id.slice(-8)}</h3>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>Submitted by {record.submittedBy || "Anonymous"}</span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                {record.processedData.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {record.processedData.slice(0, 4).map((field, fieldIndex) => {
                                      const IconComponent = getFieldIcon(field.fieldType)
                                      return (
                                        <div
                                          key={fieldIndex}
                                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                                        >
                                          <div className="flex-shrink-0">
                                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-muted-foreground">
                                              {field.fieldLabel}
                                            </div>
                                            <div className="text-sm truncate font-medium">{field.displayValue}</div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <p>No field data available</p>
                                  </div>
                                )}

                                {record.processedData.length > 4 && (
                                  <div className="mt-3 text-sm text-muted-foreground text-center">
                                    +{record.processedData.length - 4} more fields
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {records.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Timeline className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No records found</h3>
                      <p>No form submissions match your current filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} • {stats.totalRecords} total records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Lookup Sources Tab */}
        <TabsContent value="lookup-sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Lookup Sources
              </CardTitle>
              <CardDescription>
                Forms and modules that this form references through lookup fields with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lookupSources.length > 0 ? (
                <div className="grid gap-6">
                  {lookupSources.map((source) => (
                    <Card
                      key={`${source.type}-${source.id}`}
                      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "h-14 w-14 rounded-xl flex items-center justify-center shadow-sm",
                                source.type === "form" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600",
                              )}
                            >
                              {source.type === "form" ? (
                                <FileText className="h-7 w-7" />
                              ) : (
                                <Folder className="h-7 w-7" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-gray-900">{source.name}</h3>
                                {source.isPublished !== undefined && (
                                  <Badge variant={source.isPublished ? "default" : "secondary"} className="text-xs">
                                    {source.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-medium mb-3">{source.breadcrumb}</p>
                              {source.description && (
                                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{source.description}</p>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</div>
                                  <div className="text-sm font-semibold text-gray-900 capitalize">{source.type}</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                    Records
                                  </div>
                                  <div className="text-sm font-bold text-blue-700">
                                    {source.recordCount.toLocaleString()}
                                  </div>
                                </div>
                                {source.fieldCount !== undefined && (
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                      Fields
                                    </div>
                                    <div className="text-sm font-bold text-green-700">{source.fieldCount}</div>
                                  </div>
                                )}
                                <div className="bg-purple-50 rounded-lg p-3">
                                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                    Updated
                                  </div>
                                  <div className="text-sm font-semibold text-purple-700">
                                    {new Date(source.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="shrink-0 bg-transparent" asChild>
                            <a
                              href={source.type === "form" ? `/forms/${source.id}/records` : `/modules/${source.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View {source.type === "form" ? "Records" : "Module"}
                            </a>
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Database className="h-20 w-20 mx-auto mb-6 opacity-40" />
                  <h3 className="text-xl font-semibold mb-3">No lookup sources found</h3>
                  <p className="text-base max-w-md mx-auto leading-relaxed">
                    This form doesn't reference any other forms or modules through lookup fields.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Linked Records Tab */}
        <TabsContent value="linked-records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Linked Records
              </CardTitle>
              <CardDescription>
                Forms that have lookup fields pointing to this form with comprehensive details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedForms.length > 0 ? (
                <div className="grid gap-6">
                  {linkedForms.map((linkedForm) => (
                    <Card
                      key={linkedForm.id}
                      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                              <Link className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-gray-900">{linkedForm.name}</h3>
                                {linkedForm.isPublished !== undefined && (
                                  <Badge variant={linkedForm.isPublished ? "default" : "secondary"} className="text-xs">
                                    {linkedForm.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-medium mb-3">{linkedForm.breadcrumb}</p>
                              {linkedForm.description && (
                                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{linkedForm.description}</p>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                    Records
                                  </div>
                                  <div className="text-sm font-bold text-blue-700">
                                    {linkedForm.recordCount.toLocaleString()}
                                  </div>
                                </div>
                                {linkedForm.fieldCount !== undefined && (
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                      Total Fields
                                    </div>
                                    <div className="text-sm font-bold text-green-700">{linkedForm.fieldCount}</div>
                                  </div>
                                )}
                                {linkedForm.lookupFieldsCount !== undefined && (
                                  <div className="bg-orange-50 rounded-lg p-3">
                                    <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                                      Lookup Fields
                                    </div>
                                    <div className="text-sm font-bold text-orange-700">
                                      {linkedForm.lookupFieldsCount}
                                    </div>
                                  </div>
                                )}
                                <div className="bg-purple-50 rounded-lg p-3">
                                  <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                    Updated
                                  </div>
                                  <div className="text-sm font-semibold text-purple-700">
                                    {new Date(linkedForm.updatedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="shrink-0 bg-transparent" asChild>
                            <a
                              href={`/forms/${linkedForm.id}/records`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Records
                            </a>
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Link className="h-20 w-20 mx-auto mb-6 opacity-40" />
                  <h3 className="text-xl font-semibold mb-3">No linked records found</h3>
                  <p className="text-base max-w-md mx-auto leading-relaxed">
                    No other forms are referencing this form through lookup fields.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Record Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Record Details
            </DialogTitle>
            <DialogDescription>
              Record #{selectedRecord?.id.slice(-8)} • Submitted{" "}
              {selectedRecord && new Date(selectedRecord.submittedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Record Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Record ID</label>
                  <p className="font-mono text-sm">{selectedRecord.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={cn("border", getStatusColor(selectedRecord.status || "submitted"))}>
                      {selectedRecord.status || "submitted"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedRecord.submittedBy || "Anonymous"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted At</label>
                  <p>{new Date(selectedRecord.submittedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Enhanced Record Data in Excel-like Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Form Data ({selectedRecord.processedData.length} fields)
                </h3>

                {selectedRecord.processedData.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[200px]">
                            Field Name
                          </th>
                          <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[100px]">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.processedData.map((field, index) => {
                          const IconComponent = getFieldIcon(field.fieldType)
                          return (
                            <tr
                              key={index}
                              className={cn(
                                "border-b hover:bg-blue-50 transition-colors",
                                index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                              )}
                            >
                              <td className="border-r border-gray-200 px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{field.fieldLabel}</span>
                                </div>
                              </td>
                              <td className="border-r border-gray-200 px-4 py-3 text-sm">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {field.fieldType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="max-w-md">
                                  {field.fieldType === "file" && typeof field.value === "object" ? (
                                    <div className="text-sm bg-muted p-2 rounded">
                                      <pre className="text-xs overflow-auto">
                                        {JSON.stringify(field.value, null, 2)}
                                      </pre>
                                    </div>
                                  ) : field.fieldType === "lookup" ? (
                                    <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                      <div className="font-medium">{field.displayValue}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Raw: {JSON.stringify(field.value)}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="font-medium break-words">{field.displayValue}</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No field data available for this record</p>
                  </div>
                )}
              </div>

              {/* Raw Data Debug (Development only) */}
              {process.env.NODE_ENV === "development" && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Raw Record Data (Debug)</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-xs overflow-auto">{JSON.stringify(selectedRecord.recordData, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
