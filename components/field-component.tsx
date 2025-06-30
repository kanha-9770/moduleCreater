"use client"

import { useState, type ChangeEvent } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { GripVertical, MoreHorizontal, Settings, Trash2, Copy, Eye, EyeOff, Star } from 'lucide-react'
import FieldSettings from "./field-settings"

import type { FormField, FieldOption } from "@/types/form-builder"
import LookupField from "./lookup-field"

interface FieldComponentProps {
  field: FormField
  isPreview?: boolean
  isOverlay?: boolean
  onUpdate?: (updates: Partial<FormField>) => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export default function FieldComponent({
  field,
  isPreview = false,
  isOverlay = false,
  onUpdate,
  onDelete,
  onDuplicate,
}: FieldComponentProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [value, setValue] = useState(field.defaultValue || "")
  const [date, setDate] = useState<Date>()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: {
      type: "Field",
      field,
    },
    disabled: isPreview || isOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  const getWidthClass = () => {
    switch (field.width) {
      case "half":
        return "col-span-1"
      case "third":
        return "col-span-1"
      case "quarter":
        return "col-span-1"
      default:
        return "col-span-full"
    }
  }

  // Ensure options is always an array
  const fieldOptions: FieldOption[] = Array.isArray(field.options) ? field.options : []

  const renderFieldInput = () => {
    const baseStyle = {
      backgroundColor: field.styling?.backgroundColor || "transparent",
      color: field.styling?.textColor || "inherit",
      borderColor: field.styling?.borderColor || "inherit",
      fontSize: field.styling?.fontSize || "14px",
      fontWeight: field.styling?.fontWeight || "normal",
    }

    switch (field.type) {
      case "text":
      case "email":
      case "url":
      case "tel":
        return (
          <Input
            type={field.type}
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || undefined}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={handleChange}
            rows={4}
            placeholder={field.placeholder || undefined}
            className="w-full resize-none"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || undefined}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || undefined}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || undefined}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "select":
        return (
          <Select value={value} onValueChange={setValue} disabled={isPreview && field.readonly}>
            <SelectTrigger className="w-full" style={baseStyle}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map((option, index) => (
                <SelectItem key={option.value || `option-${index}`} value={option.value || option.label || `option-${index}`}>
                  {option.label || option.value || `Option ${index + 1}`}
                </SelectItem>
              ))}
              {fieldOptions.length === 0 && (
                <SelectItem value="no-options" disabled>
                  No options available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup value={value} onValueChange={setValue} disabled={isPreview && field.readonly}>
            {fieldOptions.map((option, index) => (
              <div key={option.value || `option-${index}`} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value || option.label || `option-${index}`} 
                  id={`${field.id}-${index}`} 
                />
                <Label htmlFor={`${field.id}-${index}`}>
                  {option.label || option.value || `Option ${index + 1}`}
                </Label>
              </div>
            ))}
            {fieldOptions.length === 0 && (
              <div className="text-sm text-gray-500 italic">No options configured</div>
            )}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {fieldOptions.map((option, index) => (
              <div key={option.value || `option-${index}`} className="flex items-center space-x-2">
                <Checkbox id={`${field.id}-${index}`} disabled={isPreview && field.readonly} />
                <Label htmlFor={`${field.id}-${index}`}>
                  {option.label || option.value || `Option ${index + 1}`}
                </Label>
              </div>
            ))}
            {fieldOptions.length === 0 && (
              <div className="text-sm text-gray-500 italic">No options configured</div>
            )}
          </div>
        )

      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch disabled={isPreview && field.readonly} />
            <Label>{field.label}</Label>
          </div>
        )

      case "slider":
        return (
          <div className="space-y-2">
            <Slider
              defaultValue={[Number(value) || 0]}
              max={100}
              step={1}
              className="w-full"
              disabled={isPreview && field.readonly}
            />
            <div className="text-sm text-gray-500">Value: {value || 0}</div>
          </div>
        )

      case "file":
        return (
          <Input
            type="file"
            accept={field.properties?.accept}
            onChange={handleChange}
            placeholder={field.placeholder || undefined}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "rating":
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 cursor-pointer ${
                  star <= Number(value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
                onClick={() => !field.readonly && setValue(star.toString())}
              />
            ))}
          </div>
        )

      case "hidden":
        return (
          <Input
            value={value}
            className="w-full"
            placeholder={field.placeholder || undefined}
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "password":
        return (
          <Input
            type="password"
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || undefined}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )

      case "lookup":
      case "user":
        return <LookupField field={field} value={value} onChange={setValue} disabled={isPreview && field.readonly} />

      default:
        return (
          <Input
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder || "Enter value"}
            className="w-full"
            style={baseStyle}
            disabled={isPreview && field.readonly}
            readOnly={field.readonly}
          />
        )
    }
  }

  if (!field.visible && !isPreview) {
    return (
      <Card className="border-dashed border-gray-300 opacity-50">
        <CardContent className="p-4 text-center">
          <EyeOff className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-500">Hidden Field: {field.label}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`group transition-all duration-300 ${getWidthClass()} ${
          isDragging
            ? "shadow-2xl scale-105 rotate-1 border-2 border-blue-400 bg-blue-50 z-50"
            : "hover:shadow-md border-gray-200"
        }`}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Field Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isPreview && !isOverlay && (
                  <div
                    {...attributes}
                    {...listeners}
                    className={`cursor-grab hover:cursor-grabbing p-1 rounded transition-all duration-200 ${
                      isDragging ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    {field.label}
                    {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.description && <p className="text-xs text-gray-500 mt-1">{field.description}</p>}
                </div>
                <Badge variant="outline" className="text-xs">
                  {field.type}
                </Badge>
              </div>

              {!isPreview && !isOverlay && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Field Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Field
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onUpdate?.({ visible: !field.visible })}>
                      {field.visible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {field.visible ? "Hide" : "Show"} Field
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdate?.({ readonly: !field.readonly })}>
                      <Settings className="w-4 h-4 mr-2" />
                      {field.readonly ? "Make Editable" : "Make Read-only"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Field
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Field Input */}
            <div className="space-y-2">{renderFieldInput()}</div>

            {/* Field Footer */}
            {field.validation?.required && isPreview && <p className="text-xs text-red-500">This field is required</p>}
          </div>
        </CardContent>

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100 border-2 border-blue-400 rounded-lg flex items-center justify-center">
            <div className="text-blue-700 font-medium">Moving field...</div>
          </div>
        )}
      </Card>

      {/* Field Settings Dialog */}
      {showSettings && (
        <FieldSettings
          field={field}
          open={showSettings}
          onOpenChange={setShowSettings}
          onUpdate={onUpdate || (() => {})}
        />
      )}
    </>
  )
}
