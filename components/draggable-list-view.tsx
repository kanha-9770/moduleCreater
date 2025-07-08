"use client"

import type React from "react"
import { useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronRight,
  ChevronDown,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Folder,
  FolderOpen,
  Globe,
  Eye,
  BarChart3,
  Settings,
  Copy,
  GripVertical,
} from "lucide-react"
import Link from "next/link"
import type { FormModule, Form } from "@/types/form-builder"

interface DraggableListViewProps {
  modules: FormModule[]
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
  onMoveModule: (moduleId: string, newParentId?: string, newSortOrder?: number) => Promise<void>
}

interface DraggableModuleNodeProps {
  module: FormModule
  level: number
  isExpanded: boolean
  onToggleExpanded: (moduleId: string) => void
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
}

function DraggableModuleNode({
  module,
  level,
  isExpanded,
  onToggleExpanded,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
}: DraggableModuleNodeProps) {
  const hasChildren = module.children && module.children.length > 0
  const hasForms = module.forms && module.forms.length > 0
  const hasContent = hasChildren || hasForms

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
    data: {
      type: "module",
      module,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const paddingLeft = level * 24 + 16

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      {/* Module Header */}
      <div
        className={`group flex items-center gap-3 p-3 hover:bg-gray-50 transition-all duration-200 border-l-2 ${
          level === 0 ? "border-l-blue-500" : level === 1 ? "border-l-green-500" : "border-l-orange-500"
        } ${isDragging ? "bg-blue-50 shadow-lg" : ""}`}
        style={{ paddingLeft }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-200 transition-colors flex-shrink-0"
          onClick={() => hasContent && onToggleExpanded(module.id)}
          disabled={!hasContent}
        >
          {hasContent ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        {/* Module Icon */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-5 w-5 text-blue-600" />
            ) : (
              <Folder className="h-5 w-5 text-blue-600" />
            )
          ) : (
            <FileText className="h-5 w-5 text-gray-600" />
          )}
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{module.name}</h3>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {module.forms?.length || 0} forms
              </Badge>
              {hasChildren && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-green-700 border-green-200">
                  {module.children?.length} sub
                </Badge>
              )}
              {module.level > 0 && (
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0.5 ${
                    level === 1
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-orange-300 text-orange-700 bg-orange-50"
                  }`}
                >
                  L{module.level}
                </Badge>
              )}
            </div>
          </div>
          {module.description && <p className="text-sm text-gray-600 truncate mt-1">{module.description}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-blue-100"
            onClick={() => onCreateSubModule(module.id)}
            title="Add Sub-module"
          >
            <Plus className="h-4 w-4 text-blue-600" />
          </Button>

          <Link href={`/modules/${module.id}`}>
            <Button variant="ghost" size="sm" className="h-7 px-3 text-sm hover:bg-green-100">
              Open
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-200">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEditModule(module)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Module
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateSubModule(module.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Sub-module
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteModule(module.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Forms Section - Only show when expanded */}
      {isExpanded && hasForms && (
        <div className="bg-gradient-to-r from-gray-50/50 to-white border-l-2 border-l-gray-300">
          <div style={{ paddingLeft: paddingLeft + 40 }}>
            <div className="py-3">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <h4 className="font-medium text-gray-700 text-sm">Forms ({module.forms.length})</h4>
              </div>

              <div className="space-y-2">
                {module.forms.map((form: Form) => (
                  <Card
                    key={form.id}
                    className="shadow-sm hover:shadow-md transition-all duration-200 border-l-2 border-l-blue-200"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate text-sm">{form.name}</h5>
                            {form.description && (
                              <p className="text-xs text-gray-600 truncate mt-1">{form.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{form.recordCount || 0} submissions</span>
                              {form.isPublished && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 border-green-200">
                                  <Globe className="h-2 w-2 mr-1" />
                                  Live
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link href={`/forms/${form.id}/builder`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-blue-100"
                              title="Edit Form"
                            >
                              <Edit className="h-3 w-3 text-blue-600" />
                            </Button>
                          </Link>
                          <Link href={`/preview/${form.id}`} target="_blank">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-green-100"
                              title="Preview Form"
                            >
                              <Eye className="h-3 w-3 text-green-600" />
                            </Button>
                          </Link>
                          <Link href={`/forms/${form.id}/analytics`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-purple-100"
                              title="View Analytics"
                            >
                              <BarChart3 className="h-3 w-3 text-purple-600" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DragOverlayContent({ module }: { module: FormModule }) {
  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <Folder className="h-5 w-5 text-blue-600" />
        <span className="font-medium text-sm">{module.name}</span>
        <Badge variant="secondary" className="text-xs">
          {module.forms?.length || 0}
        </Badge>
      </div>
    </div>
  )
}

export default function DraggableListView({
  modules,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
  onMoveModule,
}: DraggableListViewProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeModule, setActiveModule] = useState<FormModule | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleToggleExpanded = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const renderModuleTree = (moduleList: FormModule[], level = 0): React.ReactNode[] => {
    const elements: React.ReactNode[] = []

    for (const module of moduleList) {
      // Render the module
      elements.push(
        <DraggableModuleNode
          key={module.id}
          module={module}
          level={level}
          isExpanded={expandedModules.has(module.id)}
          onToggleExpanded={handleToggleExpanded}
          onEditModule={onEditModule}
          onDeleteModule={onDeleteModule}
          onCreateSubModule={onCreateSubModule}
        />,
      )

      // Render children if expanded and they exist
      if (expandedModules.has(module.id) && module.children && module.children.length > 0) {
        elements.push(
          <div key={`${module.id}-children`} className="relative">
            {renderModuleTree(module.children, level + 1)}
          </div>,
        )
      }
    }

    return elements
  }

  const getAllModuleIds = (moduleList: FormModule[]): string[] => {
    const ids: string[] = []
    for (const module of moduleList) {
      ids.push(module.id)
      if (module.children) {
        ids.push(...getAllModuleIds(module.children))
      }
    }
    return ids
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const module = active.data.current?.module
    if (module) {
      setActiveModule(module)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveModule(null)

    if (!over || active.id === over.id) return

    const activeModuleData = active.data.current?.module
    const overModuleData = over.data.current?.module

    if (!activeModuleData) return

    try {
      if (overModuleData) {
        // Dropping on another module - make it a child
        await onMoveModule(activeModuleData.id, overModuleData.id)
        // Expand the parent to show the new child
        setExpandedModules((prev) => new Set([...prev, overModuleData.id]))
      } else {
        // Dropping on root - make it a root module
        await onMoveModule(activeModuleData.id)
      }
    } catch (error) {
      console.error("Failed to move module:", error)
    }
  }

  const allModuleIds = getAllModuleIds(modules)

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Module List</h3>
            <p className="text-sm text-gray-600">Drag modules to reorganize • Compact view with expandable sections</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExpandedModules(new Set())} className="text-xs">
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = new Set<string>()
                const collectIds = (mods: FormModule[]) => {
                  mods.forEach((mod) => {
                    if ((mod.children && mod.children.length > 0) || (mod.forms && mod.forms.length > 0)) {
                      allIds.add(mod.id)
                    }
                    if (mod.children) collectIds(mod.children)
                  })
                }
                collectIds(modules)
                setExpandedModules(allIds)
              }}
              className="text-xs"
            >
              Expand All
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allModuleIds} strategy={verticalListSortingStrategy}>
            {modules.length > 0 ? (
              <div className="divide-y divide-gray-100">{renderModuleTree(modules)}</div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h4 className="font-medium text-gray-900 mb-2">No modules found</h4>
                <p className="text-sm">Create your first module to get started with the hierarchy</p>
              </div>
            )}
          </SortableContext>

          <DragOverlay>{activeModule ? <DragOverlayContent module={activeModule} /> : null}</DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
