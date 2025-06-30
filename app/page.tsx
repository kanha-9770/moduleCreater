"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Loader2,
  Grid,
  List,
  Sidebar,
  Globe,
  Eye,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import type { FormModule, Form } from "@/types/form-builder"

export default function HomePage() {
  const { toast } = useToast()
  const [modules, setModules] = useState<FormModule[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<FormModule | null>(null)
  const [moduleData, setModuleData] = useState({ name: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "sidebar">("grid")

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/modules")
      const data = await response.json()

      if (data.success) {
        setModules(data.data)
      } else {
        throw new Error(data.error || "Failed to fetch modules")
      }
    } catch (error: any) {
      console.error("Error fetching modules:", error)
      toast({
        title: "Error",
        description: "Failed to load modules. Please try again.",
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
        body: JSON.stringify(moduleData),
      })

      const data = await response.json()

      if (data.success) {
        setModules([data.data, ...modules])
        setIsCreateDialogOpen(false)
        setModuleData({ name: "", description: "" })
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

  const handleEditModule = async () => {
    if (!editingModule || !moduleData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Module name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/modules/${editingModule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      })

      const data = await response.json()

      if (data.success) {
        setModules(modules.map((m) => (m.id === editingModule.id ? data.data : m)))
        setIsEditDialogOpen(false)
        setEditingModule(null)
        setModuleData({ name: "", description: "" })
        toast({
          title: "Success",
          description: "Module updated successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to update module")
      }
    } catch (error: any) {
      console.error("Error updating module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update module. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setModules(modules.filter((m) => m.id !== moduleId))
        toast({
          title: "Success",
          description: "Module deleted successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to delete module")
      }
    } catch (error: any) {
      console.error("Error deleting module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete module. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (module: FormModule) => {
    setEditingModule(module)
    setModuleData({ name: module.name, description: module.description || "" })
    setIsEditDialogOpen(true)
  }

  const renderModuleCard = (module: FormModule) => (
    <Card key={module.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {module.name}
            </CardTitle>
            {module.description && (
              <CardDescription className="text-sm text-gray-600 mt-1">{module.description}</CardDescription>
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
              <DropdownMenuItem onClick={() => openEditDialog(module)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Module
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteModule(module.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Forms</span>
            <Badge variant="secondary">{module.forms?.length || 0}</Badge>
          </div>

          {module.forms && module.forms.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Forms</h4>
              <div className="space-y-1">
                {module.forms.slice(0, 3).map((form: Form) => (
                  <div key={form.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-xs font-medium text-gray-700 truncate">{form.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {form.isPublished && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <Globe className="h-2 w-2 mr-1" />
                          Live
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Link href={`/preview/${form.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link href={`/forms/${form.id}/analytics`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {module.forms.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">+{module.forms.length - 3} more forms</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <Link href={`/modules/${module.id}`}>
              <Button className="w-full" size="sm">
                Open Module
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderModuleList = (module: FormModule) => (
    <Card key={module.id} className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{module.name}</h3>
                {module.description && <p className="text-sm text-gray-600">{module.description}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">{module.forms?.length || 0} forms</Badge>
            <div className="flex items-center gap-1">
              <Link href={`/modules/${module.id}`}>
                <Button size="sm">Open</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(module)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteModule(module.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSidebarView = () => (
    <div className="flex h-[calc(100vh-200px)]">
      <div className="w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Modules</h3>
        <div className="space-y-2">
          {modules.map((module) => (
            <div
              key={module.id}
              className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">{module.name}</h4>
                  <p className="text-xs text-gray-600">{module.forms?.length || 0} forms</p>
                </div>
                <Link href={`/modules/${module.id}`}>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Select a Module</h3>
          <p className="text-sm">Choose a module from the sidebar to view its forms and details.</p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
              <p className="text-gray-600">Create and manage your forms</p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="grid" className="flex items-center gap-1">
                    <Grid className="h-4 w-4" />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="sidebar" className="flex items-center gap-1">
                    <Sidebar className="h-4 w-4" />
                    Sidebar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Module</DialogTitle>
                    <DialogDescription>Create a new module to organize your forms.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
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
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first module to organize your forms.</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Module
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map(renderModuleCard)}
              </div>
            )}
            {viewMode === "list" && <div className="space-y-4">{modules.map(renderModuleList)}</div>}
            {viewMode === "sidebar" && renderSidebarView()}
          </>
        )}
      </div>

      {/* Edit Module Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
            <DialogDescription>Update the module details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Module Name</Label>
              <Input
                id="edit-name"
                value={moduleData.name}
                onChange={(e) => setModuleData({ ...moduleData, name: e.target.value })}
                placeholder="Enter module name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={moduleData.description}
                onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                placeholder="Enter module description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditModule} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
