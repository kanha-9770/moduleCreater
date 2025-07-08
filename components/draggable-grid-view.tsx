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
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Folder,
  FileText,
  Globe,
  Eye,
  BarChart3,
  Settings,
  Copy,
  GripVertical,
} from "lucide-react"
import Link from "next/link"
import type { FormModule, Form } from "@/types/form-builder"

interface DraggableGridViewProps {
  modules: FormModule[]
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
  onMoveModule: (moduleId: string, newParentId?: string, newSortOrder?: number) => Promise<void>
}

interface DraggableModuleCardProps {
  module: FormModule
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
}

function DraggableModuleCard({ module, onEditModule, onDeleteModule, onCreateSubModule }: DraggableModuleCardProps) {
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
    <Card
      ref={setNodeRef}
      style={style}
      className={`group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-blue-300 ${
        isDragging ? "shadow-2xl border-blue-400" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>

                {module.children && module.children.length > 0 ? (
                  <Folder className="h-5 w-5 text-blue-600" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-600" />
                )}
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {module.name}
                </CardTitle>
              </div>
              {module.level > 0 && (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    module.level === 1
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-orange-300 text-orange-700 bg-orange-50"
                  }`}
                >
                  Level {module.level}
                </Badge>
              )}
            </div>
            {module.description && (
              <CardDescription className="text-sm text-gray-600">{module.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Forms</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {module.forms?.length || 0}
              </Badge>
            </div>
            {module.children && module.children.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sub-modules</span>
                <Badge variant="outline" className="border-green-300 text-green-700">
                  {module.children.length}
                </Badge>
              </div>
            )}
          </div>

          {/* Recent Forms */}
          {module.forms && module.forms.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Forms</h4>
              <div className="space-y-2">
                {module.forms.slice(0, 3).map((form: Form) => (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate">{form.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {form.isPublished && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 border-green-200">
                          <Globe className="h-2 w-2 mr-1" />
                          Live
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Link href={`/forms/${form.id}/builder`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-100">
                            <Edit className="h-3 w-3 text-blue-600" />
                          </Button>
                        </Link>
                        <Link href={`/preview/${form.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-green-100">
                            <Eye className="h-3 w-3 text-green-600" />
                          </Button>
                        </Link>
                        <Link href={`/forms/${form.id}/analytics`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-purple-100">
                            <BarChart3 className="h-3 w-3 text-purple-600" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {module.forms.length > 3 && (
                  <p className="text-xs text-gray-500 text-center py-1">+{module.forms.length - 3} more forms</p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t">
            <Link href={`/modules/${module.id}`}>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="sm"
              >
                Open Module
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DragOverlayContent({ module }: { module: FormModule }) {
  return (
    <Card className="w-80 shadow-2xl border-2 border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-gray-900">{module.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{module.forms?.length || 0} forms</span>
          {module.children && module.children.length > 0 && <span>{module.children.length} sub-modules</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DraggableGridView({
  modules,
  onEditModule,
  onDeleteModule,
  onCreateSubModule,
  onMoveModule,
}: DraggableGridViewProps) {
  const [activeModule, setActiveModule] = useState<FormModule | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const getAllModulesFlat = (moduleList: FormModule[]): FormModule[] => {
    const flat: FormModule[] = []
    for (const module of moduleList) {
      flat.push(module)
      if (module.children) {
        flat.push(...getAllModulesFlat(module.children))
      }
    }
    return flat
  }

  const flatModules = getAllModulesFlat(modules)

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
      } else {
        // Dropping on root - make it a root module
        await onMoveModule(activeModuleData.id)
      }
    } catch (error) {
      console.error("Failed to move module:", error)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={flatModules.map((m) => m.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {flatModules.map((module) => (
            <DraggableModuleCard
              key={module.id}
              module={module}
              onEditModule={onEditModule}
              onDeleteModule={onDeleteModule}
              onCreateSubModule={onCreateSubModule}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>{activeModule ? <DragOverlayContent module={activeModule} /> : null}</DragOverlay>
    </DndContext>
  )
}
