"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, Search, Database, FileText, Folder, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FormField } from "@/types/form-builder"

interface LookupSource {
  id: string
  name: string
  type: "form" | "module" | "static"
  description?: string
  recordCount?: number
  icon?: string
}

interface LookupConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateFields: (fields: Partial<FormField>[]) => void
  sectionId: string
}

export default function LookupConfigurationDialog({
  open,
  onOpenChange,
  onCreateFields,
  sectionId,
}: LookupConfigurationDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<LookupSource[]>([])
  const [selectedSource, setSelectedSource] = useState<LookupSource | null>(null)
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [fieldMappings, setFieldMappings] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch lookup sources when dialog opens
  useEffect(() => {
    if (open) {
      fetchSources()
      setStep(1)
      setSelectedSource(null)
      setSelectedFields([])
      setFieldMappings({})
    }
  }, [open])

  // Fetch available fields when source is selected
  useEffect(() => {
    if (selectedSource) {
      fetchSourceFields(selectedSource.id)
    }
  }, [selectedSource])

  const fetchSources = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/lookup/sources")
      const result = await response.json()

      if (result.success) {
        setSources(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch lookup sources",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSourceFields = async (sourceId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/lookup/fields?sourceId=${sourceId}`)
      const result = await response.json()

      if (result.success) {
        setAvailableFields(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch source fields",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSourceSelect = (source: LookupSource) => {
    setSelectedSource(source)
    setStep(2)
  }

  const handleFieldToggle = (fieldName: string) => {
    setSelectedFields((prev) => {
      const newFields = prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]

      // Initialize field mapping for new fields
      if (!prev.includes(fieldName)) {
        setFieldMappings((prevMappings) => ({
          ...prevMappings,
          [fieldName]: {
            display: fieldName,
            value: "id",
            store: fieldName,
          },
        }))
      }

      return newFields
    })
  }

  const handleFieldMappingChange = (fieldName: string, mappingType: string, value: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [mappingType]: value,
      },
    }))
  }

  const handleCreateFields = () => {
    if (!selectedSource || selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field",
        variant: "destructive",
      })
      return
    }

    const newFields: Partial<FormField>[] = selectedFields.map((fieldName, index) => ({
      id: `lookup_${selectedSource.id}_${fieldName}_${Date.now()}_${index}`,
      type: "lookup",
      label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
      placeholder: `Select ${fieldName}...`,
      description: `Lookup field for ${fieldName} from ${selectedSource.name}`,
      sectionId,
      order: index,
      visible: true,
      readonly: false,
      validation: {
        required: false,
      },
      lookup: {
        sourceId: selectedSource.id,
        multiple: false,
        searchable: true,
        searchPlaceholder: `Search ${fieldName}...`,
        fieldMapping: fieldMappings[fieldName] || {
          display: fieldName,
          value: "id",
          store: fieldName,
        },
      },
    }))

    onCreateFields(newFields)
    onOpenChange(false)

    toast({
      title: "Success!",
      description: `Created ${newFields.length} lookup field${newFields.length > 1 ? "s" : ""}`,
    })
  }

  const getSourceIcon = (source: LookupSource) => {
    switch (source.type) {
      case "form":
        return <FileText className="h-5 w-5" />
      case "module":
        return <Folder className="h-5 w-5" />
      case "static":
        return <Globe className="h-5 w-5" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  const filteredSources = sources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Configure Lookup Fields</DialogTitle>
          <DialogDescription>
            Select a data source and choose fields to create lookup fields automatically
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredSources.map((source) => (
                      <Card
                        key={source.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSourceSelect(source)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getSourceIcon(source)}
                              <CardTitle className="text-sm">{source.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {source.type}
                              </Badge>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {source.recordCount || 0} records
                            </Badge>
                          </div>
                        </CardHeader>
                        {source.description && (
                          <CardContent className="pt-0">
                            <CardDescription className="text-xs">{source.description}</CardDescription>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {step === 2 && selectedSource && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(selectedSource)}
                  <h3 className="font-semibold">{selectedSource.name}</h3>
                  <Badge variant="outline">{selectedSource.type}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  Change Source
                </Button>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Select Fields ({selectedFields.length} selected)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose which fields you want to create lookup fields for
                </p>

                <ScrollArea className="h-[300px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableFields.map((fieldName) => (
                        <div key={fieldName} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={fieldName}
                              checked={selectedFields.includes(fieldName)}
                              onCheckedChange={() => handleFieldToggle(fieldName)}
                            />
                            <Label htmlFor={fieldName} className="flex-1 text-sm">
                              {fieldName}
                            </Label>
                          </div>

                          {selectedFields.includes(fieldName) && (
                            <Card className="ml-6 p-3">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Display Field</Label>
                                  <Select
                                    value={fieldMappings[fieldName]?.display || fieldName}
                                    onValueChange={(value) => handleFieldMappingChange(fieldName, "display", value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>
                                          {field}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Value Field</Label>
                                  <Select
                                    value={fieldMappings[fieldName]?.value || "id"}
                                    onValueChange={(value) => handleFieldMappingChange(fieldName, "value", value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>
                                          {field}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Store Field</Label>
                                  <Select
                                    value={fieldMappings[fieldName]?.store || fieldName}
                                    onValueChange={(value) => handleFieldMappingChange(fieldName, "store", value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>
                                          {field}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === 2 && (
            <Button onClick={handleCreateFields} disabled={selectedFields.length === 0}>
              Create {selectedFields.length} Lookup Field{selectedFields.length !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
