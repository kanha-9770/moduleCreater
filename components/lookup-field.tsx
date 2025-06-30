"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, X, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { FormField } from "@/types/form-builder"

interface LookupFieldProps {
  field: FormField
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  error?: string
}

interface LookupOption {
  value: string
  label: string
  description?: string
  data?: any
}

export default function LookupField({ field, value, onChange, disabled = false, error }: LookupFieldProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [options, setOptions] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedValues, setSelectedValues] = useState<any[]>([])

  // Initialize selected values from prop
  useEffect(() => {
    if (value !== undefined) {
      if (field.lookup?.multiple) {
        // Handle multiple selection
        if (Array.isArray(value)) {
          setSelectedValues(value)
        } else if (value) {
          setSelectedValues([value])
        } else {
          setSelectedValues([])
        }
      } else {
        // Handle single selection
        setSelectedValues(value ? [value] : [])
      }
    } else {
      setSelectedValues([])
    }
  }, [value, field.lookup?.multiple])

  // Load options when component mounts or search changes
  useEffect(() => {
    if (field.lookup?.sourceId) {
      loadOptions()
    }
  }, [field.lookup?.sourceId, searchQuery])

  const loadOptions = async () => {
    if (!field.lookup?.sourceId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        sourceId: field.lookup.sourceId,
        ...(searchQuery && { search: searchQuery }),
        ...(field.lookup.fieldMapping?.display && { displayField: field.lookup.fieldMapping.display }),
        ...(field.lookup.fieldMapping?.value && { valueField: field.lookup.fieldMapping.value }),
        ...(field.lookup.fieldMapping?.store && { storeField: field.lookup.fieldMapping.store }),
        ...(field.lookup.fieldMapping?.description && { descriptionField: field.lookup.fieldMapping.description }),
      })

      const response = await fetch(`/api/lookup/data?${params}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setOptions(result.data || [])
        } else {
          console.error("Failed to load lookup options:", result.error)
          toast({
            title: "Error",
            description: "Failed to load lookup options",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error loading lookup options:", error)
      toast({
        title: "Error",
        description: "Failed to load lookup options",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (field.lookup?.searchable !== false) {
        loadOptions()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelect = (option: LookupOption) => {
    if (field.lookup?.multiple) {
      // Multiple selection
      const isSelected = selectedValues.some((val) => {
        if (typeof val === "object" && val !== null) {
          return val.value === option.value
        }
        return val === option.value
      })

      let newValues: any[]
      if (isSelected) {
        // Remove from selection
        newValues = selectedValues.filter((val) => {
          if (typeof val === "object" && val !== null) {
            return val.value !== option.value
          }
          return val !== option.value
        })
      } else {
        // Add to selection
        const valueToStore = field.lookup?.fieldMapping?.store
          ? { value: option.value, label: option.label, store: option.data?.[field.lookup.fieldMapping.store] }
          : option.value
        newValues = [...selectedValues, valueToStore]
      }

      setSelectedValues(newValues)
      onChange?.(newValues)
    } else {
      // Single selection
      const valueToStore = field.lookup?.fieldMapping?.store
        ? { value: option.value, label: option.label, store: option.data?.[field.lookup.fieldMapping.store] }
        : option.value

      setSelectedValues([valueToStore])
      onChange?.(valueToStore)
      setOpen(false)
    }
  }

  const handleRemove = (valueToRemove: any) => {
    if (field.lookup?.multiple) {
      const newValues = selectedValues.filter((val) => {
        if (typeof val === "object" && val !== null) {
          return val.value !== (typeof valueToRemove === "object" ? valueToRemove.value : valueToRemove)
        }
        return val !== valueToRemove
      })
      setSelectedValues(newValues)
      onChange?.(newValues)
    } else {
      setSelectedValues([])
      onChange?.(null)
    }
  }

  const getDisplayValue = (val: any): string => {
    if (typeof val === "object" && val !== null) {
      return val.label || val.value || String(val)
    }
    return String(val)
  }

  const isSelected = (option: LookupOption): boolean => {
    return selectedValues.some((val) => {
      if (typeof val === "object" && val !== null) {
        return val.value === option.value
      }
      return val === option.value
    })
  }

  // Memoized display text for the trigger button
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return field.placeholder || "Select option..."
    }

    if (field.lookup?.multiple) {
      if (selectedValues.length === 1) {
        return getDisplayValue(selectedValues[0])
      }
      return `${selectedValues.length} items selected`
    } else {
      return getDisplayValue(selectedValues[0])
    }
  }, [selectedValues, field.placeholder, field.lookup?.multiple])

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-transparent",
              error && "border-red-500",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {field.lookup?.searchable !== false && (
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={field.lookup?.searchPlaceholder || "Search options..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            )}
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading options...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => handleSelect(option)}
                        className="flex items-center gap-2"
                      >
                        <Check className={cn("mr-2 h-4 w-4", isSelected(option) ? "opacity-100" : "opacity-0")} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground truncate">{option.description}</div>
                          )}
                        </div>
                        {field.lookup?.multiple && isSelected(option) && (
                          <Badge variant="secondary" className="ml-auto">
                            Selected
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Values Display for Multiple Selection */}
      {field.lookup?.multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <span className="truncate max-w-[150px]">{getDisplayValue(val)}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleRemove(val)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
