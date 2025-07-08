"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ChevronRight, ChevronDown, Plus, FolderOpen, Folder, FileText, Loader2 } from "lucide-react"
import type { FormModule } from "@/types/form-builder"

interface HierarchicalModuleTreeProps {
  onModuleSelect?: (module: FormModule) => void
  selectedModuleId?: string
}

export default function HierarchicalModuleTree({ onModuleSelect, selectedModuleId }: HierarchicalModuleTreeProps) {
  const { toast } = useToast()
  const [modules, setModules] = useState<FormModule[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>("")
  const [moduleData, setModuleData] = useState({ name: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchModuleHierarchy()
  }, [])

  const fetchModuleHierarchy = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/modules/hierarchy")
      const data = await response.json()
      if (data.success) {
        setModules(data.data)
        // Auto-expand first level
        const firstLevelIds = data.data.map((m: FormModule) => m.id)
        setExpandedModules(new Set(firstLevelIds))
      } else {
        throw new Error(data.error || "Failed to fetch module hierarchy")
      }
    } catch (error: any) {
      console.error("Error fetching module hierarchy:", error)
      toast({
        title: "Error",
        description: "Failed to load module hierarchy. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModule = async () => {
    if (!moduleData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Module name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...moduleData,
          parentId: selectedParentId || undefined,
        }),
      })
      const data = await response.json()
      if (data.success) {
        await fetchModuleHierarchy() // Refresh the hierarchy
        setIsCreateDialogOpen(false)
        setModuleData({ name: "", description: "" })
        setSelectedParentId("")
        toast({
          title: "Success",
          description: "Module created successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to create module")
      }
    } catch (error: any) {
      console.error("Error creating module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create module. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleExpanded = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const getAllModulesFlat = (modules: FormModule[]): FormModule[] => {
    const result: FormModule[] = []
    const traverse = (moduleList: FormModule[]) => {
      moduleList.forEach((module) => {
        result.push(module)
        if (module.children && module.children.length > 0) {
          traverse(module.children)
        }
      })
    }
    traverse(modules)
    return result
  }

  const renderModuleNode = (module: FormModule, level = 0) => {
    const hasChildren = module.children && module.children.length > 0
    const isExpanded = expandedModules.has(module.id)
    const isSelected = selectedModuleId === module.id
    const indent = level * 20

    return (
      <div key={module.id} className="w-full">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 ${
            isSelected ? "bg-blue-50 border border-blue-200" : ""
          }`}
          style={{ marginLeft: `${indent}px` }}
          onClick={() => onModuleSelect?.(module)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(module.id)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600" />
              )
            ) : (
              <FileText className="h-4 w-4 text-gray-600" />
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{module.name}</span>
                <Badge variant="secondary" className="text-xs">
                  L{module.level}
                </Badge>
                {module.moduleType === "child" && (
                  <Badge variant="outline" className="text-xs">
                    Sub
                  </Badge>
                )}
              </div>
              {module.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{module.description}</p>}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{module.forms?.length || 0} forms</span>
                {hasChildren && <span className="text-xs text-gray-500">{module.children?.length} submodules</span>}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">{module.children?.map((child) => renderModuleNode(child, level + 1))}</div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Module Hierarchy</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
              <DialogDescription>
                Create a new module. You can choose a parent module to create a nested structure.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="parent">Parent Module (Optional)</Label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent module (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">No Parent (Root Level)</SelectItem>
                    {getAllModulesFlat(modules).map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {"  ".repeat(module.level)}
                        {module.name} (Level {module.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Module Name</Label>
                <Input
                  id="name"
                  value={moduleData.name}
                  onChange={(e) => setModuleData({ ...moduleData, name: e.target.value })}
                  placeholder="Enter module name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={moduleData.description}
                  onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                  placeholder="Enter module description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateModule} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          {modules.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-600 mb-6">Create your first module to get started.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Module
              </Button>
            </div>
          ) : (
            <div className="space-y-1">{modules.map((module) => renderModuleNode(module, 0))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
