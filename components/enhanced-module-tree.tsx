"use client"

import React, { useState, useCallback } from "react"
import { useDrag, useDrop, DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Move,
  Copy,
  FolderPlus,
  Settings,
  Eye,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import type { FormModule, Form } from "@/types/form-builder"
import Link from "next/link"

interface EnhancedModuleTreeProps {
  modules: FormModule[]
  selectedModule: FormModule | null
  selectedForm: Form | null
  onModuleSelect: (module: FormModule) => void
  onFormSelect: (form: Form) => void
  onCreateSubmodule: (parentId: string) => void
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onMoveModule: (moduleId: string, newParentId?: string) => void
  onDuplicateModule: (module: FormModule) => void
  level?: number
  className?: string
}

interface DragItem {
  type: string
  id: string
  module: FormModule
  sourceParentId?: string
}

const ItemTypes = {
  MODULE: "module",
}

function ModuleNode({
  module,
  level,
  selectedModule,
  selectedForm,
  onModuleSelect,
  onFormSelect,
  onCreateSubmodule,
  onEditModule,
  onDeleteModule,
  onMoveModule,
  onDuplicateModule,
  expandedModules,
  toggleExpanded,
}: {
  module: FormModule
  level: number
  selectedModule: FormModule | null
  selectedForm: Form | null
  onModuleSelect: (module: FormModule) => void
  onFormSelect: (form: Form) => void
  onCreateSubmodule: (parentId: string) => void
  onEditModule: (module: FormModule) => void
  onDeleteModule: (moduleId: string) => void
  onMoveModule: (moduleId: string, newParentId?: string) => void
  onDuplicateModule: (module: FormModule) => void
  expandedModules: Set<string>
  toggleExpanded: (moduleId: string) => void
}) {
  const hasChildren = module.children && module.children.length > 0
  const hasForms = module.forms && module.forms.length > 0
  const expanded = expandedModules.has(module.id)
  const isSelected = selectedModule?.id === module.id

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MODULE,
    item: (): DragItem => ({
      type: ItemTypes.MODULE,
      id: module.id,
      module,
      sourceParentId: module.parentId || undefined,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.MODULE,
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop() && item.id !== module.id) {
        // Don't allow dropping a module into its own children
        if (!isDescendant(item.module, module)) {
          onMoveModule(item.id, module.id)
        }
      }
    },
    canDrop: (item: DragItem) => {
      return item.id !== module.id && !isDescendant(item.module, module)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  // Check if a module is a descendant of another module
  const isDescendant = (ancestor: FormModule, descendant: FormModule): boolean => {
    if (!ancestor.children) return false
    
    for (const child of ancestor.children) {
      if (child.id === descendant.id) return true
      if (isDescendant(child, descendant)) return true
    }
    return false
  }

  const getIndentClass = (currentLevel: number) => {
    const indents = [
      "pl-0",
      "pl-4", 
      "pl-8", 
      "pl-12", 
      "pl-16", 
      "pl-20"
    ]
    return indents[Math.min(currentLevel, indents.length - 1)] || "pl-20"
  }

  const handleContextMenuAction = (action: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    switch (action) {
      case "create-submodule":
        onCreateSubmodule(module.id)
        break
      case "edit":
        onEditModule(module)
        break
      case "duplicate":
        onDuplicateModule(module)
        break
      case "delete":
        onDeleteModule(module.id)
        break
    }
  }

  const contextMenuItems = (
    <>
      <ContextMenuItem onClick={(e) => handleContextMenuAction("create-submodule", e)}>
        <FolderPlus className="mr-2 h-4 w-4" />
        Add Submodule
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={(e) => handleContextMenuAction("edit", e)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Module
      </ContextMenuItem>
      <ContextMenuItem onClick={(e) => handleContextMenuAction("duplicate", e)}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicate Module
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Move className="mr-2 h-4 w-4" />
          Move to...
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={(e) => { e.preventDefault(); onMoveModule(module.id, undefined) }}>
            <Folder className="mr-2 h-4 w-4" />
            Root Level
          </ContextMenuItem>
          {/* Add other available parent modules here */}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem 
        onClick={(e) => handleContextMenuAction("delete", e)}
        className="text-red-600"
        disabled={hasChildren}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Module
      </ContextMenuItem>
    </>
  )

  return (
    <div className="w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={(node) => {
              if (node) {
                drag(drop(node))
              }
              return null
            }}
            className={`
              flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-200 group
              ${getIndentClass(level)}
              ${isSelected 
                ? "bg-blue-50 border border-blue-200 shadow-sm" 
                : "hover:bg-gray-50 border border-transparent"
              }
              ${isDragging ? "opacity-50" : ""}
              ${isOver && canDrop ? "bg-green-50 border-green-200" : ""}
              ${isOver && !canDrop ? "bg-red-50 border-red-200" : ""}
            `}
            onClick={() => onModuleSelect(module)}
          >
            <div className="flex items-center flex-1 min-w-0">
              {/* Expand/Collapse Button */}
              <div className="flex-shrink-0 w-5 h-5 mr-2">
                {(hasChildren || hasForms) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(module.id)
                    }}
                  >
                    {expanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                ) : (
                  <div className="w-5 h-5" />
                )}
              </div>

              {/* Module Icon */}
              <div className="flex-shrink-0 mr-2">
                {expanded && (hasChildren || hasForms) ? (
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )}
              </div>

              {/* Module Name and Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                    {module.name}
                  </span>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {module.moduleType === "child" && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Sub
                      </Badge>
                    )}
                    
                    {hasChildren && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {module.children?.length} sub
                      </Badge>
                    )}
                    
                    {hasForms && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {module.forms?.length} forms
                      </Badge>
                    )}
                  </div>
                </div>
                
                {module.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {module.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex-shrink-0 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onCreateSubmodule(module.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Submodule
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEditModule(module)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Module
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicateModule(module)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Module
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/modules/${module.id}`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Module
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteModule(module.id)} 
                    className="text-red-600"
                    disabled={hasChildren}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Module
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {contextMenuItems}
        </ContextMenuContent>
      </ContextMenu>

      {/* Child Elements */}
      {expanded && (
        <div className="mt-1">
          {/* Child Modules (Submodules) */}
          {hasChildren && module.children?.map((childModule) => (
            <ModuleNode
              key={childModule.id}
              module={childModule}
              level={level + 1}
              selectedModule={selectedModule}
              selectedForm={selectedForm}
              onModuleSelect={onModuleSelect}
              onFormSelect={onFormSelect}
              onCreateSubmodule={onCreateSubmodule}
              onEditModule={onEditModule}
              onDeleteModule={onDeleteModule}
              onMoveModule={onMoveModule}
              onDuplicateModule={onDuplicateModule}
              expandedModules={expandedModules}
              toggleExpanded={toggleExpanded}
            />
          ))}

          {/* Forms */}
          {hasForms && module.forms?.map((form) => {
            const isFormSelected = selectedForm?.id === form.id
            
            return (
              <ContextMenu key={form.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={`
                      flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-200 group
                      ${getIndentClass(level + 1)} ml-4
                      ${isFormSelected 
                        ? "bg-green-50 border border-green-200 shadow-sm" 
                        : "hover:bg-gray-50 border border-transparent"
                      }
                    `}
                    onClick={() => onFormSelect?.(form)}
                    onClick={() => onFormSelect(form)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 w-5 h-5 mr-2" />
                      
                      <div className="flex-shrink-0 mr-2">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm truncate ${isFormSelected ? "text-green-700 font-medium" : "text-gray-700"}`}>
                            {form.name}
                          </span>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {form.isPublished && (
                              <Badge variant="default" className="text-xs px-1 py-0 bg-green-500">
                                Live
                              </Badge>
                            )}
                            
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {form.recordCount || 0} records
                            </Badge>
                          </div>
                        </div>
                        
                        {form.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {form.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem asChild>
                    <Link href={`/builder/${form.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Form
                    </Link>
                  </ContextMenuItem>
                  <ContextMenuItem asChild>
                    <Link href={`/preview/${form.id}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Form
                    </Link>
                  </ContextMenuItem>
                  <ContextMenuItem asChild>
                    <Link href={`/forms/${form.id}/analytics`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EnhancedModuleTree({
  modules,
  selectedModule,
  selectedForm,
  onModuleSelect,
  onFormSelect,
  onCreateSubmodule,
  onEditModule,
  onDeleteModule,
  onMoveModule,
  onDuplicateModule,
  level = 0,
  className = ""
}: EnhancedModuleTreeProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }, [expandedModules])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`space-y-1 ${className}`}>
        {modules.map((module) => (
          <ModuleNode
            key={module.id}
            module={module}
            level={level}
            selectedModule={selectedModule}
            selectedForm={selectedForm}
            onModuleSelect={onModuleSelect}
            onFormSelect={onFormSelect}
            onCreateSubmodule={onCreateSubmodule}
            onEditModule={onEditModule}
            onDeleteModule={onDeleteModule}
            onMoveModule={onMoveModule}
            onDuplicateModule={onDuplicateModule}
            expandedModules={expandedModules}
            toggleExpanded={toggleExpanded}
          />
        ))}
      </div>
    </DndProvider>
  )
}