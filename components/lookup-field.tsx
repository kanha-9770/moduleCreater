"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Loader2, Search, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LookupFieldProps {
  field: {
    id: string
    label: string
    type: string
    placeholder?: string
    description?: string | null
    validation: {
      required?: boolean
      minLength?: number
      maxLength?: number
      pattern?: string
      patternMessage?: string
    }
    lookup?: {
      sourceId?: string
      multiple?: boolean
      searchable?: boolean
      searchPlaceholder?: string
      allowCustomValues?: boolean
      fieldMapping?: {
        display: string
        value: string
        store: string
        description?: string | null
      }
    }
  }
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  error?: string
}

interface LookupOption {
  id: string
  label: string
  value: string
  storeValue: any
  description?: string | null
  data?: any
  type?: string
  isCustom?: boolean
}

export function LookupField({ field, value, onChange, disabled = false, error }: LookupFieldProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<LookupOption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOptions, setSelectedOptions] = useState<LookupOption[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isMultiple = field.lookup?.multiple || false
  const isSearchable = field.lookup?.searchable !== false
  const allowCustomValues = field.lookup?.allowCustomValues !== false
  const sourceId = field.lookup?.sourceId

  useEffect(() => {
    if (value && (options.length > 0 || allowCustomValues)) {
      const normalizeValue = (val: any): LookupOption => {
        const existingOption = options.find((opt) => opt.storeValue === val)
        if (existingOption) return existingOption
        return {
          id: `custom-${String(val)}`,
          label: String(val ?? "Unknown"),
          value: String(val ?? "unknown"),
          storeValue: val,
          isCustom: true,
          type: "text",
        }
      }

      if (isMultiple && Array.isArray(value)) {
        setSelectedOptions(value.map(normalizeValue))
      } else if (!isMultiple && value) {
        setSelectedOptions([normalizeValue(value)])
      }
    } else {
      setSelectedOptions([])
    }
  }, [value, options, isMultiple, allowCustomValues])

  useEffect(() => {
    if (sourceId) fetchOptions()
  }, [sourceId])

  useEffect(() => {
    if (!isSearchable || !sourceId) return
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => fetchOptions(searchTerm), 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchTerm, sourceId, isSearchable])

  const fetchOptions = async (search = "") => {
    if (!sourceId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ sourceId, search, limit: "50" })
      const response = await fetch(`/api/lookup/data?${params}`)
      if (!response.ok) throw new Error("Failed to fetch options")
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to fetch options")

      const transformedOptions: LookupOption[] = result.data.map((item: any) => {
        const mapping = field.lookup?.fieldMapping || {
          display: "New Text",
          value: "record_id",
          store: "New Text",
          description: null,
        }

        const fieldData = item[mapping.display] ||
          Object.values(item).find((val: any) => val?.field_label === mapping.display) ||
          Object.values(item).find((val: any) => val?.field_id === mapping.display) ||
          item["New Text"] || {}

        const storeData = item[mapping.store] ||
          Object.values(item).find((val: any) => val?.field_label === mapping.store) ||
          Object.values(item).find((val: any) => val?.field_id === mapping.store) ||
          fieldData

        let fieldValue = fieldData.field_value ?? item[mapping.display] ?? "Unknown"
        let storeValue = storeData.field_value ?? fieldValue

        let displayLabel = String(fieldValue)
        if (fieldData.field_type === "datetime" && fieldValue) {
          try {
            displayLabel = new Date(fieldValue).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
          } catch {
            console.warn(`Invalid datetime format for field ${mapping.display}: ${fieldValue}`)
          }
        } else if (fieldData.field_type === "date" && fieldValue) {
          try {
            displayLabel = new Date(fieldValue).toLocaleDateString("en-US", { dateStyle: "medium" })
          } catch {
            console.warn(`Invalid date format for field ${mapping.display}: ${fieldValue}`)
          }
        } else if (fieldData.field_type === "number") {
          displayLabel = Number(fieldValue).toString()
        }

        return {
          id: item.record_id || `temp-${Math.random()}`,
          label: displayLabel,
          value: String(item[mapping.value] || item.record_id || Math.random()),
          storeValue: storeValue,
          description: mapping.description && item[mapping.description]?.field_value,
          data: item,
          type: fieldData.field_type || "text",
          isCustom: false,
        }
      })

      setOptions(transformedOptions)
    } catch (error) {
      console.error("Error fetching lookup options:", error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (option: LookupOption) => {
    let newSelected: LookupOption[]
    if (isMultiple) {
      newSelected = selectedOptions.some((selected) => selected.value === option.value)
        ? selectedOptions.filter((selected) => selected.value !== option.value)
        : [...selectedOptions, option]
    } else {
      newSelected = [option]
      setOpen(false)
    }
    setSelectedOptions(newSelected)
    onChange?.(isMultiple ? newSelected.map((opt) => opt.storeValue) : newSelected[0].storeValue)
  }

  const handleCreateCustom = () => {
    if (!searchTerm.trim() || !allowCustomValues) return
    const customOption: LookupOption = {
      id: `custom-${Date.now()}`,
      label: searchTerm.trim(),
      value: searchTerm.trim(),
      storeValue: searchTerm.trim(),
      isCustom: true,
      type: "text",
    }

    if (selectedOptions.some((opt) => opt.storeValue === customOption.storeValue)) return

    const newSelected = isMultiple ? [...selectedOptions, customOption] : [customOption]
    setSelectedOptions(newSelected)
    onChange?.(isMultiple ? newSelected.map((opt) => opt.storeValue) : newSelected[0].storeValue)
    if (!isMultiple) setOpen(false)
    setSearchTerm("")
  }

  const handleRemove = (optionToRemove: LookupOption) => {
    const newSelected = isMultiple
      ? selectedOptions.filter((selected) => selected.value !== optionToRemove.value)
      : []
    setSelectedOptions(newSelected)
    onChange?.(isMultiple ? newSelected.map((opt) => opt.storeValue) : null)
  }

  const displayValue = () => {
    if (selectedOptions.length === 0) return field.placeholder || "Select..."
    return isMultiple ? `${selectedOptions.length} selected` : selectedOptions[0].label
  }

  const searchMatchesExisting = options.some((option) =>
    (typeof option.label === "string" ? option.label.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (typeof option.storeValue === "string" ? option.storeValue.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  )

  const searchExistsInSelected = selectedOptions.some((opt) =>
    String(opt.storeValue || "").toLowerCase() === searchTerm.trim().toLowerCase()
  )

  const showCreateOption = allowCustomValues && searchTerm.trim() && !searchMatchesExisting && !searchExistsInSelected

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedOptions.length && "text-muted-foreground",
              error && "border-red-500"
            )}
            disabled={disabled}
          >
            <span className="truncate">{displayValue()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {isSearchable && (
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={field.lookup?.searchPlaceholder || "Search or type to create..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && showCreateOption) {
                      e.preventDefault()
                      handleCreateCustom()
                    }
                  }}
                />
              </div>
            )}
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : (
                <CommandGroup>
                  <ScrollArea className="h-[200px]">
                    {showCreateOption && (
                      <CommandItem
                        onSelect={handleCreateCustom}
                        className="flex items-center cursor-pointer hover:bg-accent"
                      >
                        <Plus className="mr-2 h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium text-green-600">Create "{searchTerm.trim()}"</div>
                          <div className="text-xs text-muted-foreground">Add as new custom value</div>
                        </div>
                      </CommandItem>
                    )}
                    {options.length === 0 && !showCreateOption ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {allowCustomValues ? "No options found. Type to create a custom value." : "No options found."}
                      </div>
                    ) : (
                      options.map((option) => {
                        const isSelected = selectedOptions.some((selected) => selected.value === option.value)
                        return (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => handleSelect(option)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center">
                              <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                {option.description && (
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        )
                      })
                    )}
                  </ScrollArea>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isMultiple && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant={option.isCustom ? "default" : "secondary"} className="text-xs">
              {option.isCustom && <Plus className="mr-1 h-3 w-3" />}
              {option.label}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => handleRemove(option)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {allowCustomValues && (
        <p className="text-xs text-muted-foreground">Type to search existing values or create new ones</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}