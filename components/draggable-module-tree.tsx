"use client"

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronRight,
  ChevronDown,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Folder,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import type { FormModule } from "@/types/form-builder"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the lint error

interface DraggableModuleTreeProps {
  modules: FormModule[]
  onMoveModule: (moduleId: string, newParentId?: string, newSortOrder?: number) => Promise<void>
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
}

interface ModuleItemProps {
  module: FormModule
  level: number
  isExpanded: boolean
  onToggleExpanded: (moduleId: string) => void
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
}

function ModuleItem({
  module,
  level,
  isExpanded,
  onToggleExpanded,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
}: ModuleItemProps) {
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

  const hasChildren = module.children && module.children.length > 0
  const paddingLeft = level * 24 + 12

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className={`group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
          isDragging ? "bg-blue-50 border-2 border-blue-200" : ""
        }`}
        style={{ paddingLeft }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => hasChildren && onToggleExpanded(module.id)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="h-3 w-3" />
          )}
        </Button>

        {/* Module Icon */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-600" />
          )}
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{module.name}</span>
            <Badge variant="secondary" className="text-xs">
              {module.forms?.length || 0}
            </Badge>
            {module.level > 0 && (
              <Badge variant="outline" className="text-xs">
                L{module.level}
              </Badge>
            )}
          </div>
          {module.description && <p className="text-xs text-gray-600 truncate">{module.description}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onCreateSubModule(module.id)}>
            <Plus className="h-3 w-3" />
          </Button>

          <Link href={`/modules/${module.id}`}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Open
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditModule(module)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateSubModule(module.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Sub-module
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteModule(module.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function DragOverlayContent({ module }: { module: FormModule }) {
  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-2 shadow-lg">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-sm">{module.name}</span>
        <Badge variant="secondary" className="text-xs">
          {module.forms?.length || 0}
        </Badge>
      </div>
    </div>
  )
}

export default function DraggableModuleTree({
  modules,
  onMoveModule,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
}: DraggableModuleTreeProps) {
  const [activeModule, setActiveModule] = useState<FormModule | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

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

  const renderModuleTree = (moduleList: FormModule[], level = 0): JSX.Element[] => {
    const elements: JSX.Element[] = []

    for (const module of moduleList) {
      elements.push(
        <ModuleItem
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

      // Render children if expanded
      if (expandedModules.has(module.id) && module.children && module.children.length > 0) {
        elements.push(...renderModuleTree(module.children, level + 1))
      }
    }

    return elements
  }

  // Get all module IDs for sortable context
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

  const allModuleIds = getAllModuleIds(modules)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allModuleIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">{renderModuleTree(modules)}</div>
      </SortableContext>

      <DragOverlay>{activeModule ? <DragOverlayContent module={activeModule} /> : null}</DragOverlay>
    </DndContext>
  )
}
