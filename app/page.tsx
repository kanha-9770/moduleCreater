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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  Settings,
  Database,
  Calendar,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  TreePine,
  FolderPlus
} from "lucide-react"
import Link from "next/link"
import type { FormModule, Form } from "@/types/form-builder"
import { EnhancedModuleTree } from "@/components/enhanced-module-tree"

interface FormRecord {
  id: string
  formId: string
  data: Record<string, any>
  submittedAt: Date
  status: "pending" | "approved" | "rejected"
}

interface ParentModuleOption {
  id: string
  name: string
  level: number
  path: string
}

export default function HomePage() {
  const { toast } = useToast()
  const [modules, setModules] = useState<FormModule[]>([])
  const [selectedModule, setSelectedModule] = useState<FormModule | null>(null)
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [formRecords, setFormRecords] = useState<FormRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<FormModule | null>(null)
  const [moduleData, setModuleData] = useState({
    name: "",
    description: "",
    parentId: "",
    icon: "",
    color: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "sidebar" | "tree">("tree")
  const [rightPanelTab, setRightPanelTab] = useState<"publish" | "records">("publish")
  const [availableParents, setAvailableParents] = useState<ParentModuleOption[]>([])

  useEffect(() => {
    fetchModules()
  }, [])

  useEffect(() => {
    if (selectedForm) {
      fetchFormRecords(selectedForm.id)
    }
  }, [selectedForm])

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/modules")
      const data = await response.json()

      if (data.success) {
        setModules(data.data)
        // Build parent options from flat module list
        buildParentOptions(data.data)
        // Auto-select first module if available
        if (data.data.length > 0) {
          setSelectedModule(data.data[0])
        }
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

  const buildParentOptions = (moduleList: FormModule[]) => {
    const flattenModules = (modules: FormModule[], level = 0): ParentModuleOption[] => {
      const options: ParentModuleOption[] = []

      modules.forEach(module => {
        options.push({
          id: module.id,
          name: module.name,
          level,
          path: module.path || module.name.toLowerCase().replace(/\s+/g, '-')
        })

        if (module.children && module.children.length > 0) {
          options.push(...flattenModules(module.children, level + 1))
        }
      })

      return options
    }

    const options = flattenModules(moduleList)
    setAvailableParents(options)
  }

  const fetchFormRecords = async (formId: string) => {
    try {
      setRecordsLoading(true)
      const response = await fetch(`/api/forms/${formId}/records`)
      const data = await response.json()

      if (data.success) {
        setFormRecords(data.data || [])
      } else {
        console.error("Failed to fetch records:", data.error)
        setFormRecords([])
      }
    } catch (error: any) {
      console.error("Error fetching form records:", error)
      setFormRecords([])
    } finally {
      setRecordsLoading(false)
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
      const createData = {
        name: moduleData.name,
        description: moduleData.description,
        parentId: moduleData.parentId || undefined,
        icon: moduleData.icon || undefined,
        color: moduleData.color || undefined,
      }

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchModules() // Refresh the entire tree
        setIsCreateDialogOpen(false)
        setModuleData({ name: "", description: "", parentId: "", icon: "", color: "" })
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
      const updateData = {
        name: moduleData.name,
        description: moduleData.description,
        parentId: moduleData.parentId || undefined,
        icon: moduleData.icon || undefined,
        color: moduleData.color || undefined,
      }

      const response = await fetch(`/api/modules/${editingModule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchModules() // Refresh the entire tree
        setIsEditDialogOpen(false)
        setEditingModule(null)
        setModuleData({ name: "", description: "", parentId: "", icon: "", color: "" })
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
        await fetchModules() // Refresh the entire tree
        if (selectedModule?.id === moduleId) {
          setSelectedModule(null)
          setSelectedForm(null)
        }
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

  const handleCreateSubmodule = (parentId: string) => {
    setModuleData({ name: "", description: "", parentId, icon: "", color: "" })
    setIsCreateDialogOpen(true)
  }

  const handleMoveModule = async (moduleId: string, newParentId?: string) => {
    try {
      const response = await fetch(`/api/modules/${moduleId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchModules() // Refresh the entire tree
        toast({
          title: "Success",
          description: "Module moved successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to move module")
      }
    } catch (error: any) {
      console.error("Error moving module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to move module. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateModule = async (module: FormModule) => {
    try {
      const duplicateData = {
        name: `${module.name} (Copy)`,
        description: module.description,
        parentId: module.parentId,
        icon: module.icon,
        color: module.color,
      }

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchModules() // Refresh the entire tree
        toast({
          title: "Success",
          description: "Module duplicated successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to duplicate module")
      }
    } catch (error: any) {
      console.error("Error duplicating module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate module. Please try again.",
        variant: "destructive",
      })
    }
  }
  const handlePublishForm = async (form: Form) => {
    try {
      const response = await fetch(`/api/forms/${form.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !form.isPublished }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchModules() // Refresh to get updated form status
        toast({
          title: "Success",
          description: `Form ${form.isPublished ? "unpublished" : "published"} successfully!`,
        })
      } else {
        throw new Error(data.error || "Failed to publish form")
      }
    } catch (error: any) {
      console.error("Error publishing form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to publish form. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Success",
      description: "Form link copied to clipboard!",
    })
  }

  const openEditDialog = (module: FormModule) => {
    setEditingModule(module)
    setModuleData({
      name: module.name,
      description: module.description || "",
      parentId: module.parentId || "",
      icon: module.icon || "",
      color: module.color || ""
    })
    setIsEditDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const renderModuleCard = (module: FormModule) => (
    <Card key={module.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {module.name}
              </CardTitle>
              {module.moduleType === "child" && (
                <Badge variant="outline" className="text-xs">
                  Submodule
                </Badge>
              )}
            </div>
            {module.description && (
              <CardDescription className="text-sm text-gray-600 mt-1">{module.description}</CardDescription>
            )}
            {module.level > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Level {module.level} • Path: {module.path}
              </p>
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
              <DropdownMenuItem onClick={() => handleCreateSubmodule(module.id)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Submodule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(module)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Module
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteModule(module.id)}
                className="text-red-600"
                disabled={module.children && module.children.length > 0}
              >
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

          {module.children && module.children.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Submodules</span>
              <Badge variant="outline">{module.children.length}</Badge>
            </div>
          )}

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
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{module.name}</h3>
                  {module.moduleType === "child" && (
                    <Badge variant="outline" className="text-xs">
                      Submodule
                    </Badge>
                  )}
                </div>
                {module.description && <p className="text-sm text-gray-600">{module.description}</p>}
                {module.level > 0 && (
                  <p className="text-xs text-gray-500">Level {module.level}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Badge variant="secondary">{module.forms?.length || 0} forms</Badge>
              {module.children && module.children.length > 0 && (
                <Badge variant="outline">{module.children.length} subs</Badge>
              )}
            </div>
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
                  <DropdownMenuItem onClick={() => handleCreateSubmodule(module.id)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Add Submodule
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditDialog(module)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-600"
                    disabled={module.children && module.children.length > 0}
                  >
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

  const renderTreeView = () => (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Left Sidebar - Module Tree */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TreePine className="h-5 w-5 text-green-600" />
              Module Tree
            </h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <EnhancedModuleTree
              modules={modules}
              selectedModule={selectedModule}
              selectedForm={selectedForm}
              onModuleSelect={setSelectedModule}
              onFormSelect={setSelectedForm}
              onCreateSubmodule={handleCreateSubmodule}
              onEditModule={openEditDialog}
              onDeleteModule={handleDeleteModule}
              onMoveModule={handleMoveModule}
              onDuplicateModule={handleDuplicateModule}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Center Content - Forms */}
      <div className="flex-1 bg-gray-50">
        {selectedModule ? (
          <div className="h-full flex flex-col">
            <div className="p-6 bg-white border-b">
              <div className="">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{selectedModule.name}</h2>
                  {selectedModule.moduleType === "child" && (
                    <Badge variant="outline">Submodule</Badge>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="space-y-2 w-1/2">
                    <p className="text-gray-600 text-sm">{selectedModule.forms?.length || 0} forms in this module</p>
                    {selectedModule.children && selectedModule.children.length > 0 && (
                      <p className="text-gray-600 text-sm">{selectedModule.children.length} submodules</p>
                    )}
                    {selectedModule.level > 0 && (
                      <p className="text-gray-500 text-sm">Level {selectedModule.level}</p>
                    )}
                  </div>

                  <div className="w-1/2 flex flex-col items-end">
                    <Button className="mb-2" variant="outline" onClick={() => handleCreateSubmodule(selectedModule.id)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Add Submodule
                    </Button>
                    <Link href={`/modules/${selectedModule.id}`}>
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Module
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {selectedModule.forms && selectedModule.forms.length > 0 ? (
                  <div className="grid gap-4">
                    {selectedModule.forms.map((form: Form) => (
                      <Card
                        key={form.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedForm?.id === form.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-white"
                          }`}
                        onClick={() => setSelectedForm(form)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-medium">{form.name}</h3>
                                {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                  {form.isPublished ? (
                                    <Badge variant="default" className="text-xs">
                                      <Globe className="h-3 w-3 mr-1" />
                                      Published
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      Draft
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    Updated {new Date(form.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/builder/${form.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                              <Link href={`/preview/${form.id}`} target="_blank">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
                    <p className="text-gray-600 mb-6">Create your first form in this module.</p>
                    <Link href={`/modules/${selectedModule.id}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Form
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a Module</h3>
              <p className="text-sm">Choose a module from the tree to view its forms and details.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Publish & Records */}
      <div className="w-96 border-l bg-white">
        <div className="p-4 border-b">
          <Tabs value={rightPanelTab} onValueChange={(value) => setRightPanelTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="publish" className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                Publish
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Records
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
          <div className="p-4">
            {rightPanelTab === "publish" && (
              <div className="space-y-4">
                {selectedForm ? (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-medium">Form Publishing</h3>
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{selectedForm.name}</p>
                                <p className="text-xs text-gray-600">
                                  Status: {selectedForm.isPublished ? "Published" : "Draft"}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant={selectedForm.isPublished ? "destructive" : "default"}
                                onClick={() => handlePublishForm(selectedForm)}
                              >
                                {selectedForm.isPublished ? "Unpublish" : "Publish"}
                              </Button>
                            </div>

                            {selectedForm.isPublished && (
                              <div className="space-y-2">
                                <Separator />
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-gray-700">Public Form Link:</p>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/form/${selectedForm.id}`}
                                      readOnly
                                      className="text-xs"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => copyFormLink(selectedForm.id)}>
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Link href={`/form/${selectedForm.id}`} target="_blank" className="flex-1">
                                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Open
                                    </Button>
                                  </Link>
                                  <Link href={`/forms/${selectedForm.id}/analytics`} className="flex-1">
                                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                                      <BarChart3 className="h-3 w-3 mr-1" />
                                      Analytics
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium">Quick Actions</h3>
                      <div className="grid gap-2">
                        <Link href={`/builder/${selectedForm.id}`}>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Form
                          </Button>
                        </Link>
                        <Link href={`/preview/${selectedForm.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Form
                          </Button>
                        </Link>
                        <Link href={`/forms/${selectedForm.id}/records`}>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                            <Database className="h-4 w-4 mr-2" />
                            View All Records
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Share2 className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">Select a form to manage publishing</p>
                  </div>
                )}
              </div>
            )}

            {rightPanelTab === "records" && (
              <div className="space-y-4">
                {selectedForm ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Form Records</h3>
                      <Badge variant="secondary">{formRecords.length}</Badge>
                    </div>

                    {recordsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : formRecords.length > 0 ? (
                      <div className="space-y-3">
                        {formRecords.slice(0, 10).map((record) => (
                          <Card key={record.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(record.status)}
                                    <span className="text-xs font-medium">Record #{record.id.slice(-6)}</span>
                                  </div>
                                  <Badge className={`text-xs ${getStatusColor(record.status)}`}>{record.status}</Badge>
                                </div>

                                <div className="text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(record.submittedAt).toLocaleDateString()}
                                  </div>
                                </div>

                                {Object.keys(record.data).length > 0 && (
                                  <div className="text-xs">
                                    <p className="text-gray-500 mb-1">Sample Data:</p>
                                    <div className="bg-gray-50 p-2 rounded text-xs">
                                      {Object.entries(record.data)
                                        .slice(0, 2)
                                        .map(([key, value]) => (
                                          <div key={key} className="truncate">
                                            <span className="font-medium">{key}:</span> {String(value)}
                                          </div>
                                        ))}
                                      {Object.keys(record.data).length > 2 && (
                                        <p className="text-gray-400">
                                          +{Object.keys(record.data).length - 2} more fields
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {formRecords.length > 10 && (
                          <div className="text-center pt-2">
                            <Link href={`/forms/${selectedForm.id}/records`}>
                              <Button variant="outline" size="sm">
                                View All {formRecords.length} Records
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Database className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500 mb-2">No records yet</p>
                        <p className="text-xs text-gray-400">Records will appear here when users submit the form</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">Select a form to view records</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
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
              <h1 className="text-2xl font-bold text-gray-900">ERP SYSTEM</h1>
              <p className="text-gray-600">Create and manage your forms with hierarchical modules</p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="tree" className="flex items-center gap-1">
                    <TreePine className="h-4 w-4" />
                    Tree
                  </TabsTrigger>
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
                    <div>
                      <Label htmlFor="parentId">Parent Module (Optional)</Label>
                      <select
                        id="parentId"
                        value={moduleData.parentId}
                        onChange={(e) => setModuleData({ ...moduleData, parentId: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No Parent (Root Module)</option>
                        {availableParents.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            {"  ".repeat(parent.level)}
                            {parent.name} {parent.level > 0 ? `(Level ${parent.level})` : "(Root)"}
                          </option>
                        ))}
                      </select>
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
            <TreePine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
            {viewMode === "tree" && renderTreeView()}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map(renderModuleCard)}
              </div>
            )}
            {viewMode === "list" && <div className="space-y-4">{modules.map(renderModuleList)}</div>}
            {viewMode === "sidebar" && renderTreeView()}
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
            <div>
              <Label htmlFor="edit-parentId">Parent Module (Optional)</Label>
              <select
                id="edit-parentId"
                value={moduleData.parentId}
                onChange={(e) => setModuleData({ ...moduleData, parentId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Parent (Root Module)</option>
                {availableParents
                  .filter(parent => parent.id !== editingModule?.id) // Prevent self-selection
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {"  ".repeat(parent.level)}
                      {parent.name} {parent.level > 0 ? `(Level ${parent.level})` : "(Root)"}
                    </option>
                  ))}
              </select>
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