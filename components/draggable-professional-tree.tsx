"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Eye,
  BarChart3,
  Edit,
  Trash2,
  FolderPlus,
  FilePlus,
  GripVertical,
} from "lucide-react"
import Link from "next/link"
import type { FormModule, Form } from "@/types/form-builder"

interface DraggableProfessionalTreeProps {
  modules: FormModule[]
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
  onCreateForm?: (moduleId: string) => void
  onMoveModule: (moduleId: string, newParentId?: string, newSortOrder?: number) => Promise<void>
}

interface ContextMenuProps {
  x: number
  y: number
  moduleId: string
  moduleName: string
  onClose: () => void
  onCreateSubModule: (parentId: string) => void
  onCreateForm: (moduleId: string) => void
  onEditModule: (moduleId: string) => void
  onDeleteModule: (moduleId: string) => void
}

function ContextMenu({
  x,
  y,
  moduleId,
  moduleName,
  onClose,
  onCreateSubModule,
  onCreateForm,
  onEditModule,
  onDeleteModule,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100 bg-gray-50">
        {moduleName}
      </div>
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700"
        onClick={() => {
          onCreateSubModule(moduleId)
          onClose()
        }}
      >
        <FolderPlus className="h-4 w-4" />
        Create Sub-module
      </button>
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-green-700"
        onClick={() => {
          onCreateForm(moduleId)
          onClose()
        }}
      >
        <FilePlus className="h-4 w-4" />
        Create Form
      </button>
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          onClick={() => {
            onEditModule(moduleId)
            onClose()
          }}
        >
          <Edit className="h-4 w-4" />
          Edit Module
        </button>
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
          onClick={() => {
            onDeleteModule(moduleId)
            onClose()
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete Module
        </button>
      </div>
    </div>
  )
}

interface DraggableTreeItemProps {
  module: FormModule
  level: number
  isExpanded: boolean
  onToggleExpanded: (moduleId: string) => void
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
  onCreateForm: (moduleId: string) => void
  onContextMenu: (e: React.MouseEvent, moduleId: string, moduleName: string) => void
}

function DraggableTreeItem({
  module,
  level,
  isExpanded,
  onToggleExpanded,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
  onCreateForm,
  onContextMenu,
}: DraggableTreeItemProps) {
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

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      {/* Module Row */}
      <div
        className={`group flex items-center gap-2 py-1.5 px-2 hover:bg-blue-50 transition-colors cursor-pointer rounded-md ${
          isDragging ? "bg-blue-100 shadow-lg" : ""
        }`}
        style={{ paddingLeft: 8 + level * 20 }}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e, module.id, module.name)
        }}
        onClick={() => hasContent && onToggleExpanded(module.id)}
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

        {/* Expand/Collapse */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasContent ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            )
          ) : null}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <Folder className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Name and Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">{module.name}</span>

          {module.moduleType === "master" && (
            <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 border-blue-200 text-blue-700">
              master
            </Badge>
          )}

          {module.forms && module.forms.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {module.forms.length}
            </Badge>
          )}

          {hasChildren && (
            <Badge variant="outline" className="text-xs px-1 py-0 text-green-700 border-green-200">
              {module.children?.length} sub
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onCreateSubModule(module.id)
            }}
          >
            <FolderPlus className="h-3 w-3 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onCreateForm(module.id)
            }}
          >
            <FilePlus className="h-3 w-3 text-green-600" />
          </Button>
          <Link href={`/modules/${module.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Open
            </Button>
          </Link>
        </div>
      </div>

      {/* Children - Submodules appear INSIDE the parent */}
      {isExpanded && (
        <div>
          {/* Render Child Modules FIRST */}
          {hasChildren &&
            module.children?.map((child) => (
              <DraggableTreeItem
                key={child.id}
                module={child}
                level={level + 1}
                isExpanded={isExpanded}
                onToggleExpanded={onToggleExpanded}
                onEditModule={onEditModule}
                onDeleteModule={onDeleteModule}
                onCreateSubModule={onCreateSubModule}
                onCreateForm={onCreateForm}
                onContextMenu={onContextMenu}
              />
            ))}

          {/* Render Forms AFTER submodules */}
          {hasForms &&
            module.forms.map((form: Form) => (
              <div
                key={form.id}
                className="group flex items-center gap-2 py-1 px-2 hover:bg-green-50 transition-colors"
                style={{ paddingLeft: 8 + (level + 1) * 20 }}
              >
                <div className="w-4 h-4" />
                <div className="w-4 h-4" />
                <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm text-gray-900 truncate">{form.name}</span>
                  {form.isPublished && (
                    <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 border-green-200 text-green-700">
                      live
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/forms/${form.id}/builder`}>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <Edit className="h-3 w-3 text-blue-600" />
                    </Button>
                  </Link>
                  <Link href={`/preview/${form.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <Eye className="h-3 w-3 text-green-600" />
                    </Button>
                  </Link>
                  <Link href={`/forms/${form.id}/analytics`}>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                      <BarChart3 className="h-3 w-3 text-purple-600" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function DragOverlayContent({ module }: { module: FormModule }) {
  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-2 shadow-xl">
      <div className="flex items-center gap-2">
        <Folder className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-sm">{module.name}</span>
        <Badge variant="secondary" className="text-xs">
          {module.forms?.length || 0}
        </Badge>
      </div>
    </div>
  )
}

export default function DraggableProfessionalTree({
  modules,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
  onCreateForm = () => {},
  onMoveModule,
}: DraggableProfessionalTreeProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    moduleId: string
    moduleName: string
  } | null>(null)
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

  const handleContextMenu = (e: React.MouseEvent, moduleId: string, moduleName: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      moduleId,
      moduleName,
    })
  }

  const findModuleById = (moduleList: FormModule[], id: string): FormModule | null => {
    for (const module of moduleList) {
      if (module.id === id) return module
      if (module.children) {
        const found = findModuleById(module.children, id)
        if (found) return found
      }
    }
    return null
  }

  const handleEditModuleFromContext = (moduleId: string) => {
    const module = findModuleById(modules, moduleId)
    if (module) {
      onEditModule(module)
    }
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
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Folder className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Modules</h3>
              <p className="text-sm text-gray-600">Drag modules to reorganize • Right-click for options</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExpandedModules(new Set())}>
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
            >
              Expand All
            </Button>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="p-2 max-h-[70vh] overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allModuleIds} strategy={verticalListSortingStrategy}>
            {modules.length > 0 ? (
              <div className="space-y-0.5">
                {modules.map((module) => (
                  <DraggableTreeItem
                    key={module.id}
                    module={module}
                    level={0}
                    isExpanded={expandedModules.has(module.id)}
                    onToggleExpanded={handleToggleExpanded}
                    onEditModule={onEditModule}
                    onDeleteModule={onDeleteModule}
                    onCreateSubModule={onCreateSubModule}
                    onCreateForm={onCreateForm}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="font-medium text-gray-900 mb-2">No modules found</h4>
                <p className="text-sm">Create your first module to get started</p>
              </div>
            )}
          </SortableContext>

          <DragOverlay>{activeModule ? <DragOverlayContent module={activeModule} /> : null}</DragOverlay>
        </DndContext>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          moduleId={contextMenu.moduleId}
          moduleName={contextMenu.moduleName}
          onClose={() => setContextMenu(null)}
          onCreateSubModule={onCreateSubModule}
          onCreateForm={onCreateForm}
          onEditModule={handleEditModuleFromContext}
          onDeleteModule={onDeleteModule}
        />
      )}
    </div>
  )
}
