"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GripVertical, MoreHorizontal, Settings, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Plus } from "lucide-react"
import FieldComponent from "./field-component"
import SectionSettings from "./section-settings"
import type { FormSection, FormField } from "@/types/form-builder"
import { v4 as uuidv4 } from "uuid"

interface SectionComponentProps {
  section: FormSection
  onUpdateSection: (updates: Partial<FormSection>) => void
  onDeleteSection: () => void
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void
  onDeleteField: (fieldId: string) => void
  isOverlay?: boolean
}

export default function SectionComponent({
  section,
  onUpdateSection,
  onDeleteSection,
  onUpdateField,
  onDeleteField,
  isOverlay = false,
}: SectionComponentProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: "Section",
      section,
    },
    disabled: isOverlay,
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: section.id,
    data: {
      type: "Section",
      isSectionDropzone: true,
      section,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field_${uuidv4()}`,
      sectionId: section.id,
      type: fieldType,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`,
      placeholder: "",
      description: "",
      defaultValue: "",
      options: [],
      validation: {},
      visible: true,
      readonly: false,
      width: "full",
      order: section.fields.length,
      conditional: null,
      styling: null,
      properties: null,
      rollup: null,
      lookup: null,
      formula: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onUpdateSection({
      fields: [...section.fields, newField],
    })
  }

  const duplicateField = (field: FormField) => {
    const duplicatedField: FormField = {
      ...field,
      id: `field_${uuidv4()}`,
      label: `${field.label} (Copy)`,
      order: section.fields.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onUpdateSection({
      fields: [...section.fields, duplicatedField],
    })
  }

  const handleDeleteSection = async () => {
    if (isDeleting) return

    try {
      setIsDeleting(true)
      onDeleteSection()
    } catch (error) {
      console.error("Error deleting section:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getColumnClass = () => {
    switch (section.columns) {
      case 2:
        return "grid-cols-1 md:grid-cols-2"
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      default:
        return "grid-cols-1"
    }
  }

  if (!section.visible) {
    return (
      <Card className="border-dashed border-gray-300 opacity-50">
        <CardContent className="p-4 text-center">
          <EyeOff className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-500">Hidden Section: {section.title}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        ref={(node) => {
          setNodeRef(node)
          setDroppableRef(node)
        }}
        style={style}
        className={`group transition-all duration-300 ${
          isDragging
            ? "shadow-2xl scale-105 rotate-1 border-2 border-blue-400 bg-blue-50 z-50"
            : "hover:shadow-md border-gray-200"
        } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isOverlay && (
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
              <div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
                {section.description && <p className="text-sm text-gray-600">{section.description}</p>}
              </div>
              <Badge variant="outline" className="text-xs">
                {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {section.columns} col{section.columns !== 1 ? "s" : ""}
              </Badge>
            </div>

            {!isOverlay && (
              <div className="flex items-center gap-1">
                {section.collapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateSection({ collapsed: !section.collapsed })}
                    className="h-8 w-8 p-0"
                  >
                    {section.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isDeleting}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Section Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onUpdateSection({ visible: !section.visible })}>
                      {section.visible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {section.visible ? "Hide" : "Show"} Section
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateSection({ collapsible: !section.collapsible })}>
                      <Plus className="w-4 h-4 mr-2" />
                      {section.collapsible ? "Disable" : "Enable"} Collapsible
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteSection} className="text-red-600" disabled={isDeleting}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete Section"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        {(!section.collapsible || !section.collapsed) && (
          <CardContent className="pt-0">
            {section.fields.length > 0 ? (
              <SortableContext items={section.fields.map((f) => f.id)} strategy={rectSortingStrategy}>
                <div className={`grid gap-4 ${getColumnClass()}`}>
                  {section.fields.map((field) => (
                    <FieldComponent
                      key={field.id}
                      field={field}
                      onUpdate={(updates) => onUpdateField(field.id, updates)}
                      onDelete={() => onDeleteField(field.id)}
                      onDuplicate={() => duplicateField(field)}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 mb-4">No fields in this section yet</p>
                <p className="text-xs text-gray-400">Drag fields from the palette or drop them here to get started</p>
              </div>
            )}
          </CardContent>
        )}

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100 border-2 border-blue-400 rounded-lg flex items-center justify-center">
            <div className="text-blue-700 font-medium">Moving section...</div>
          </div>
        )}

        {/* Delete Indicator */}
        {isDeleting && (
          <div className="absolute inset-0 bg-red-100 border-2 border-red-400 rounded-lg flex items-center justify-center">
            <div className="text-red-700 font-medium">Deleting section...</div>
          </div>
        )}
      </Card>

      {/* Section Settings Dialog */}
      {showSettings && (
        <SectionSettings
          section={section}
          open={showSettings}
          onOpenChange={setShowSettings}
          onUpdate={onUpdateSection}
        />
      )}
    </>
  )
}
