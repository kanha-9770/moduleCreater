"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GripVertical,
  MoreHorizontal,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  X,
  Edit3,
} from "lucide-react"
import FieldComponent from "./field-component"
import SectionSettings from "./section-settings"
import type { FormSection, FormField } from "@/types/form-builder"
import { v4 as uuidv4 } from "uuid"

interface SectionComponentProps {
  section: FormSection
  onUpdateSection: (updates: Partial<FormSection>) => void
  onDeleteSection: () => void
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => Promise<void>
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
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: "Section",
      section,
    },
    disabled: isOverlay || isEditingTitle,
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
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
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  // Update local title when section title changes
  useEffect(() => {
    setEditTitle(section.title)
  }, [section.title])

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOverlay && !isDragging && !isDeleting) {
      setIsEditingTitle(true)
    }
  }

  const handleTitleSave = () => {
    const trimmedTitle = editTitle.trim()
    if (trimmedTitle && trimmedTitle !== section.title) {
      onUpdateSection({ title: trimmedTitle })
    } else {
      setEditTitle(section.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setEditTitle(section.title)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      e.preventDefault()
      handleTitleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleTitleCancel()
    }
  }

  const handleTitleBlur = () => {
    handleTitleSave()
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

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this section and all its fields? This action cannot be undone.",
    )
    if (!confirmDelete) return

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

  if (isOverlay) {
    return (
      <Card className="border-2 border-blue-500 shadow-2xl bg-blue-50 rotate-3 scale-105">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">{section.title}</h3>
            <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">
              {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {section.description && <p className="text-sm text-blue-700">{section.description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-blue-600">Moving section...</div>
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
        className={`group transition-all duration-300 ${isDragging
            ? "shadow-2xl scale-105 rotate-2 border-2 border-blue-400 bg-blue-50 z-50"
            : "hover:shadow-lg border-gray-200"
          } ${isOver ? "ring-2 ring-blue-300 ring-opacity-50" : ""} ${isDeleting ? "opacity-50 pointer-events-none" : ""
          }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Drag Handle */}
              {!isEditingTitle && (
                <div
                  {...attributes}
                  {...listeners}
                  className={`cursor-grab hover:cursor-grabbing p-1 rounded transition-all duration-200 ${isDragging
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                    }`}
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              <div className="flex-1">
                {/* Editable Title */}
                <div className="flex items-center gap-2 mb-1">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        onBlur={handleTitleBlur}
                        className="text-lg font-semibold h-8 px-2 py-1 border-2 border-blue-300 focus:border-blue-500"
                        placeholder="Section title"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTitleSave()
                          }}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTitleCancel()
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <h3
                        className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1"
                        onClick={handleTitleClick}
                        title="Click to edit title"
                      >
                        {section.title}
                        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {section.columns} col{section.columns !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}
                </div>

                {section.description && !isEditingTitle && (
                  <p className="text-sm text-gray-600 ml-2">{section.description}</p>
                )}
              </div>
            </div>

            {/* Section Actions */}
            {!isEditingTitle && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isDeleting}>
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
              <SortableContext items={section.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className={`grid gap-4 ${getColumnClass()}`}>
                  {section.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <FieldComponent
                        key={field.id}
                        field={field}
                        onUpdateField={async (updates: Partial<FormField>) => {
                          await onUpdateField(field.id, updates)
                        }}
                        onDeleteField={() => onDeleteField(field.id)}
                        onDuplicate={() => duplicateField(field)}
                      />
                    ))}
                </div>
              </SortableContext>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
                  }`}
              >
                <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 mb-4">No fields in this section yet</p>
                <p className="text-xs text-gray-400">Drag fields from the palette or drop them here to get started</p>
              </div>
            )}
          </CardContent>
        )}

        {/* Delete Indicator */}
        {isDeleting && (
          <div className="absolute inset-0 bg-red-100 border-2 border-red-400 rounded-lg flex items-center justify-center z-10">
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
