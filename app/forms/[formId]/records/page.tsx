"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ArrowLeft,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  RefreshCw,
} from "lucide-react"
import type { FormRecord, Form, FormField } from "@/types/form-builder"

interface RecordWithForm extends FormRecord {
  form?: Form
}

export default function FormRecordsPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string

  const [records, setRecords] = useState<RecordWithForm[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<RecordWithForm | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const recordsPerPage = 20

  // Field mapping for better display
  const [fieldMap, setFieldMap] = useState<Record<string, FormField>>({})

  useEffect(() => {
    fetchForm()
    fetchRecords()
  }, [formId, currentPage, statusFilter, searchTerm])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`)
      if (!response.ok) throw new Error("Failed to fetch form")

      const formData = await response.json()
      setForm(formData)

      // Create field mapping for better display
      const mapping: Record<string, FormField> = {}
      formData.sections?.forEach((section: any) => {
        section.fields?.forEach((field: FormField) => {
          mapping[field.id] = field
          // Also map by label for easier lookup
          mapping[field.label.toLowerCase().replace(/\s+/g, "_")] = field
        })
      })
      setFieldMap(mapping)
    } catch (err) {
      console.error("Error fetching form:", err)
      setError("Failed to load form details")
    }
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/forms/${formId}/records?${params}`)
      if (!response.ok) throw new Error("Failed to fetch records")

      const data = await response.json()
      setRecords(data.records || [])
      setTotalRecords(data.total || 0)
    } catch (err) {
      console.error("Error fetching records:", err)
      setError("Failed to load records")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/forms/${formId}/export?format=${format}`)
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `form-${formId}-records.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Export error:", err)
      setError("Failed to export records")
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/forms/${formId}/records/${recordId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete record")

      fetchRecords() // Refresh the list
    } catch (err) {
      console.error("Delete error:", err)
      setError("Failed to delete record")
    }
  }

  const formatValue = (value: any, field?: FormField): string => {
    if (value === null || value === undefined) return "-"

    if (Array.isArray(value)) {
      return value.join(", ")
    }

    if (typeof value === "object") {
      return JSON.stringify(value)
    }

    // Format based on field type
    if (field) {
      switch (field.type) {
        case "date":
          return new Date(value).toLocaleDateString()
        case "email":
          return value
        case "number":
          return Number(value).toLocaleString()
        case "checkbox":
          return value ? "Yes" : "No"
        default:
          return String(value)
      }
    }

    return String(value)
  }

  const getFieldLabel = (key: string): string => {
    // Try to find field by ID first
    if (fieldMap[key]) {
      return fieldMap[key].label
    }

    // Try to find by normalized key
    const normalizedKey = key.toLowerCase().replace(/\s+/g, "_")
    if (fieldMap[normalizedKey]) {
      return fieldMap[normalizedKey].label
    }

    // Fallback to formatted key
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getDisplayColumns = (records: RecordWithForm[]): string[] => {
    if (records.length === 0) return []

    // Get all unique keys from record data
    const allKeys = new Set<string>()
    records.forEach((record) => {
      Object.keys(record.recordData || {}).forEach((key) => allKeys.add(key))
    })

    // Sort keys by field order if available, otherwise alphabetically
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      const fieldA = fieldMap[a]
      const fieldB = fieldMap[b]

      if (fieldA && fieldB) {
        return (fieldA.order || 0) - (fieldB.order || 0)
      }

      return a.localeCompare(b)
    })

    // Return first 4 columns for table display
    return sortedKeys.slice(0, 4)
  }

  const displayColumns = getDisplayColumns(records)
  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  if (loading && records.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Form Records</h1>
              <p className="text-muted-foreground">
                {form?.name} • {totalRecords} total submissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fetchRecords()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>Export as JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRecords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  records.filter((r) => {
                    const date = new Date(r.submittedAt)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{records.filter((r) => r.status === "submitted").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRecords > 0
                  ? Math.round((records.filter((r) => r.status === "submitted").length / totalRecords) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
            <CardDescription>
              Showing {records.length} of {totalRecords} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">{error}</div>}

            {records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No records found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No submissions have been received yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Submitted By</TableHead>
                      {displayColumns.map((column) => (
                        <TableHead key={column}>{getFieldLabel(column)}</TableHead>
                      ))}
                      {Object.keys(records[0]?.recordData || {}).length > displayColumns.length && (
                        <TableHead>More Fields</TableHead>
                      )}
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">{record.id.slice(-8)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "submitted"
                                ? "default"
                                : record.status === "draft"
                                  ? "secondary"
                                  : record.status === "pending"
                                    ? "outline"
                                    : "destructive"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>{new Date(record.submittedAt).toLocaleDateString()}</TooltipTrigger>
                            <TooltipContent>{new Date(record.submittedAt).toLocaleString()}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{record.submittedBy || "Anonymous"}</TableCell>
                        {displayColumns.map((column) => {
                          const value = record.recordData?.[column]
                          const field = fieldMap[column]
                          const formattedValue = formatValue(value, field)

                          return (
                            <TableCell key={column}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="max-w-32 truncate">{formattedValue}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <strong>{getFieldLabel(column)}:</strong>
                                    <br />
                                    {formattedValue}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )
                        })}
                        {Object.keys(record.recordData || {}).length > displayColumns.length && (
                          <TableCell>
                            <Badge variant="outline">
                              +{Object.keys(record.recordData || {}).length - displayColumns.length} more
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRecord(record)
                                  setShowDetailModal(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/forms/${formId}/records/${record.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Details</DialogTitle>
              <DialogDescription>
                Submitted on {selectedRecord && new Date(selectedRecord.submittedAt).toLocaleString()}
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
                      <Badge
                        variant={
                          selectedRecord.status === "submitted"
                            ? "default"
                            : selectedRecord.status === "draft"
                              ? "secondary"
                              : selectedRecord.status === "pending"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {selectedRecord.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                    <p>{selectedRecord.submittedBy || "Anonymous"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted At</label>
                    <p>{new Date(selectedRecord.submittedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Record Data */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Form Data</h3>
                  <div className="grid gap-4">
                    {Object.entries(selectedRecord.recordData || {}).map(([key, value]) => {
                      const field = fieldMap[key]
                      const label = getFieldLabel(key)
                      const formattedValue = formatValue(value, field)

                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">{label}</label>
                            {field && (
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">Field ID: {key}</div>
                          <div className="bg-muted/50 p-3 rounded border">
                            {typeof value === "object" ? (
                              <pre className="text-sm overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                            ) : (
                              <p className="text-sm">{formattedValue}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
