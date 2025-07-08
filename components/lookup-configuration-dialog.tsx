"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Database, FileText, Zap, Loader2, Settings, CheckSquare, Key } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { FormField } from "@/types/form-builder"

interface LookupSource {
  id: string
  name: string
  type: "form" | "module" | "static"
  description?: string
  recordCount?: number
  hasIdField?: boolean
  idFieldName?: string
}

interface SourceField {
  name: string
  label: string
  type: string
  description?: string
}

interface SelectedField {
  fieldName: string
  label: string
  displayField: string
  valueField: string
  storeField: string
  multiple: boolean
  searchable: boolean
  useIdField: boolean // New property for ID field configuration
}

interface LookupConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (lookupFields: Partial<FormField>[]) => void
  sectionId: string
}

export default function LookupConfigurationDialog({
  open,
  onOpenChange,
  onConfirm,
  sectionId,
}: LookupConfigurationDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"source" | "fields" | "configure">("source")
  const [sources, setSources] = useState<LookupSource[]>([])
  const [selectedSource, setSelectedSource] = useState<LookupSource | null>(null)
  const [sourceFields, setSourceFields] = useState<SourceField[]>([])
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([])
  const [loadingSources, setLoadingSources] = useState(false)
  const [loadingFields, setLoadingFields] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)

  // Load sources when dialog opens
  useEffect(() => {
    if (open) {
      loadSources()
      resetDialog()
    }
  }, [open])

  // Load fields when source changes
  useEffect(() => {
    if (selectedSource) {
      loadSourceFields()
    }
  }, [selectedSource])

  const resetDialog = () => {
    setStep("source")
    setSelectedSource(null)
    setSourceFields([])
    setSelectedFields([])
  }

  const loadSources = async () => {
    setLoadingSources(true)
    try {
      const response = await fetch("/api/lookup/sources")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSources(result.data || [])
        } else {
          throw new Error(result.message || "Failed to load sources")
        }
      } else {
        throw new Error("Failed to fetch sources")
      }
    } catch (error) {
      console.error("Error loading sources:", error)
      toast({
        title: "Error",
        description: "Failed to load lookup sources",
        variant: "destructive",
      })
    } finally {
      setLoadingSources(false)
    }
  }

  const loadSourceFields = async () => {
    if (!selectedSource) return

    setLoadingFields(true)
    try {
      const response = await fetch(`/api/lookup/fields?sourceId=${selectedSource.id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const fields = result.data || []
          // Map field labels from getFields to SourceField objects
          const formattedFields: SourceField[] = fields.map((label: string) => ({
            name: label, // Use label as name for consistency with recordData keys
            label: label, // Use the exact label from getFields
            type: "text", // Default to text; could be enhanced if API returns field types
            description: `Field from ${selectedSource.name}`,
          }))

          setSourceFields(formattedFields)
          setStep("fields")
        } else {
          throw new Error(result.message || "Failed to load fields")
        }
      } else {
        throw new Error("Failed to fetch fields")
      }
    } catch (error) {
      console.error("Error loading fields:", error)
      toast({
        title: "Error",
        description: "Failed to load source fields",
        variant: "destructive",
      })
    } finally {
      setLoadingFields(false)
    }
  }

  const handleSourceSelect = (source: LookupSource) => {
    setSelectedSource(source)
    setSourceOpen(false)
  }

  const handleFieldToggle = (field: SourceField, checked: boolean) => {
    if (checked) {
      const newField: SelectedField = {
        fieldName: field.name,
        label: field.label,
        displayField: field.name, // Default to the same field for display
        valueField: "id", // Default to 'id' for value
        storeField: field.name, // Store the same field
        multiple: false,
        searchable: true,
        useIdField: selectedSource?.hasIdField || false, // Use ID field if available
      }

      setSelectedFields((prev) => [...prev, newField])
    } else {
      setSelectedFields((prev) => prev.filter((f) => f.fieldName !== field.name))
    }
  }

  const updateSelectedField = (fieldName: string, updates: Partial<SelectedField>) => {
    setSelectedFields((prev) => prev.map((field) => (field.fieldName === fieldName ? { ...field, ...updates } : field)))
  }

  const handleConfirm = () => {
    if (!selectedSource || selectedFields.length === 0) {
      toast({
        title: "Invalid Selection",
        description: "Please select a source and at least one field",
        variant: "destructive",
      })
      return
    }

    console.log("[Dialog] Creating lookup fields with source info:", {
      selectedSource,
    })

    // Extract source type and ID for proper field creation
    let sourceModule: string | undefined
    let sourceForm: string | undefined

    if (selectedSource.type === "module" && selectedSource.id.startsWith("module_")) {
      sourceModule = selectedSource.id.replace("module_", "")
    } else if (selectedSource.type === "form" && selectedSource.id.startsWith("form_")) {
      sourceForm = selectedSource.id.replace("form_", "")
    }

    console.log("[Dialog] Extracted source info:", {
      sourceModule,
      sourceForm,
    })

    // Create lookup field configurations
    const lookupFields: Partial<FormField>[] = selectedFields.map((field, index) => ({
      sectionId: sectionId,
      type: "lookup",
      label: field.label,
      placeholder: `Select ${field.label.toLowerCase()}...`,
      description: `Lookup field for ${field.label} from ${selectedSource.name}${field.useIdField ? " (with ID field for updates)" : ""}`,
      defaultValue: "",
      options: [],
      validation: { required: false },
      visible: true,
      readonly: false,
      width: "full" as const,
      order: index,

      // Add source information for middleware
      sourceModule,
      sourceForm,
      displayField: field.displayField,
      valueField: field.valueField,
      multiple: field.multiple,
      searchable: field.searchable,

      lookup: {
        sourceId: selectedSource.id,
        sourceType: selectedSource.type,
        multiple: field.multiple,
        searchable: field.searchable,
        searchPlaceholder: `Search ${field.label.toLowerCase()}...`,
        useIdField: field.useIdField,
        idFieldName: selectedSource.idFieldName,
        fieldMapping: {
          display: field.displayField,
          value: field.valueField,
          store: field.storeField,
          description: "description",
        },
      },
    }))

    console.log("[Dialog] Final lookup fields configuration:", lookupFields)

    onConfirm(lookupFields)
    onOpenChange(false)
    resetDialog()

    toast({
      title: "Success",
      description: `Created ${lookupFields.length} lookup field(s)${selectedFields.some((f) => f.useIdField) ? " with ID field support" : ""}`,
    })
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "form":
        return <FileText className="h-4 w-4" />
      case "module":
        return <Database className="h-4 w-4" />
      case "static":
        return <Zap className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "form":
        return "Form"
      case "module":
        return "Module"
      case "static":
        return "Built-in"
      default:
        return "Unknown"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Lookup Fields
            <Badge variant="secondary">Step {step === "source" ? "1" : step === "fields" ? "2" : "3"} of 3</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Step 1: Source Selection */}
          {step === "source" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Data Source</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the form, module, or built-in source for your lookup fields
                </p>
              </div>

              <div className="space-y-4">
                <Label>Data Source</Label>
                <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sourceOpen}
                      className="w-full justify-between h-auto p-4 bg-transparent"
                      disabled={loadingSources}
                    >
                      {selectedSource ? (
                        <div className="flex items-center gap-3 flex-1">
                          {getSourceIcon(selectedSource.type)}
                          <div className="text-left">
                            <div className="font-medium flex items-center gap-2">
                              {selectedSource.name}
                              {selectedSource.hasIdField && (
                                <Badge variant="outline" className="text-xs">
                                  <Key className="h-3 w-3 mr-1" />
                                  ID Field
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{selectedSource.description}</div>
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            {getSourceTypeLabel(selectedSource.type)}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select data source...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search data sources..." />
                      <CommandList>
                        {loadingSources ? (
                          <CommandEmpty>
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            Loading sources...
                          </CommandEmpty>
                        ) : sources.length === 0 ? (
                          <CommandEmpty>No data sources found.</CommandEmpty>
                        ) : (
                          <>
                            <CommandGroup heading="Forms">
                              {sources
                                .filter((source) => source.type === "form")
                                .map((source) => (
                                  <CommandItem
                                    key={source.id}
                                    value={source.id}
                                    onSelect={() => handleSourceSelect(source)}
                                    className="p-3"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedSource?.id === source.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <FileText className="h-4 w-4" />
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{source.name}</span>
                                          {source.hasIdField && (
                                            <Badge variant="outline" className="text-xs">
                                              <Key className="h-3 w-3 mr-1" />
                                              {source.idFieldName}
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{source.description}</span>
                                      </div>
                                      <Badge variant="outline" className="ml-auto">
                                        {source.recordCount || 0} records
                                      </Badge>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>

                            <CommandGroup heading="Modules">
                              {sources
                                .filter((source) => source.type === "module")
                                .map((source) => (
                                  <CommandItem
                                    key={source.id}
                                    value={source.id}
                                    onSelect={() => handleSourceSelect(source)}
                                    className="p-3"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedSource?.id === source.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <Database className="h-4 w-4" />
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{source.name}</span>
                                          {source.hasIdField && (
                                            <Badge variant="outline" className="text-xs">
                                              <Key className="h-3 w-3 mr-1" />
                                              {source.idFieldName}
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{source.description}</span>
                                      </div>
                                      <Badge variant="outline" className="ml-auto">
                                        {source.recordCount || 0} records
                                      </Badge>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>

                            <CommandGroup heading="Built-in Sources">
                              {sources
                                .filter((source) => source.type === "static")
                                .map((source) => (
                                  <CommandItem
                                    key={source.id}
                                    value={source.id}
                                    onSelect={() => handleSourceSelect(source)}
                                    className="p-3"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedSource?.id === source.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <Zap className="h-4 w-4" />
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{source.name}</span>
                                          {source.hasIdField && (
                                            <Badge variant="outline" className="text-xs">
                                              <Key className="h-3 w-3 mr-1" />
                                              ID
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{source.description}</span>
                                      </div>
                                      <Badge variant="outline" className="ml-auto">
                                        {source.recordCount || 0} items
                                      </Badge>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedSource && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getSourceIcon(selectedSource.type)}
                      {selectedSource.name}
                      <Badge variant="secondary">{getSourceTypeLabel(selectedSource.type)}</Badge>
                      {selectedSource.hasIdField && (
                        <Badge variant="outline">
                          <Key className="h-3 w-3 mr-1" />
                          Update Support
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {selectedSource.description}
                      {selectedSource.hasIdField && (
                        <div className="mt-2 text-sm text-blue-600">
                          ✨ This source supports record updates using the "{selectedSource.idFieldName}" field
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {selectedSource.recordCount || 0} {selectedSource.type === "static" ? "items" : "records"}{" "}
                        available
                      </span>
                      <Button onClick={() => setStep("fields")} disabled={loadingFields}>
                        {loadingFields ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading Fields...
                          </>
                        ) : (
                          "Continue to Field Selection"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Field Selection */}
          {step === "fields" && selectedSource && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Select Fields</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which fields from {selectedSource.name} to create lookup fields for
                  </p>
                </div>
                <Button variant="outline" onClick={() => setStep("source")}>
                  Back to Source
                </Button>
              </div>

              <ScrollArea className="h-96 border rounded-lg p-4">
                {sourceFields.length === 0 && loadingFields ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading fields...</span>
                  </div>
                ) : sourceFields.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No fields available for this source
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sourceFields.map((field) => {
                      const isSelected = selectedFields.some((f) => f.fieldName === field.name)
                      return (
                        <div key={field.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={field.name}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={field.name} className="font-medium cursor-pointer">
                              {field.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                          </div>
                          <Badge variant="outline">{field.type}</Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              {selectedFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      Selected Fields ({selectedFields.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedFields.map((field) => (
                        <Badge key={field.fieldName} variant="secondary">
                          {field.label}
                        </Badge>
                      ))}
                    </div>
                    <Button onClick={() => setStep("configure")} className="w-full">
                      Configure Selected Fields
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Field Configuration */}
          {step === "configure" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Configure Lookup Fields</h3>
                  <p className="text-sm text-muted-foreground">Fine-tune the configuration for each lookup field</p>
                </div>
                <Button variant="outline" onClick={() => setStep("fields")}>
                  Back to Fields
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {selectedFields.map((field) => (
                    <Card key={field.fieldName}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          {field.label}
                          {field.useIdField && (
                            <Badge variant="outline" className="text-xs">
                              <Key className="h-3 w-3 mr-1" />
                              Update Mode
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>Configure lookup behavior for this field</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Display Field</Label>
                            <select
                              className="w-full p-2 border rounded"
                              value={field.displayField}
                              onChange={(e) => updateSelectedField(field.fieldName, { displayField: e.target.value })}
                            >
                              {sourceFields.map((f) => (
                                <option key={f.name} value={f.name}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Value Field</Label>
                            <select
                              className="w-full p-2 border rounded"
                              value={field.valueField}
                              onChange={(e) => updateSelectedField(field.fieldName, { valueField: e.target.value })}
                            >
                              {sourceFields.map((f) => (
                                <option key={f.name} value={f.name}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Allow Multiple Selection</Label>
                          <Checkbox
                            checked={field.multiple}
                            onCheckedChange={(checked) =>
                              updateSelectedField(field.fieldName, { multiple: checked as boolean })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Enable Search</Label>
                          <Checkbox
                            checked={field.searchable}
                            onCheckedChange={(checked) =>
                              updateSelectedField(field.fieldName, { searchable: checked as boolean })
                            }
                          />
                        </div>

                        {selectedSource?.hasIdField && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Use ID Field for Updates</Label>
                                <p className="text-xs text-muted-foreground">
                                  When enabled, records will be updated instead of creating new ones if the{" "}
                                  {selectedSource.idFieldName} field matches
                                </p>
                              </div>
                              <Checkbox
                                checked={field.useIdField}
                                onCheckedChange={(checked) =>
                                  updateSelectedField(field.fieldName, { useIdField: checked as boolean })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === "configure" && (
            <Button onClick={handleConfirm} disabled={selectedFields.length === 0}>
              Create {selectedFields.length} Lookup Field{selectedFields.length !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
