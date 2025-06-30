"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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
import { useToast } from "@/hooks/use-toast"
import { Plus, MoreHorizontal, Edit, Trash2, FileText, Loader2, ArrowLeft, Globe, Eye } from "lucide-react"
import Link from "next/link"
import type { FormModule, Form } from "@/types/form-builder"

export default function ModulePage() {
  const params = useParams()
  const moduleId = params.moduleId as string
  const { toast } = useToast()

  const [module, setModule] = useState<FormModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (moduleId) {
      fetchModule()
    }
  }, [moduleId])

  const fetchModule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modules/${moduleId}`)
      const data = await response.json()

      if (data.success) {
        setModule(data.data)
      } else {
        throw new Error(data.error || "Failed to fetch module")
      }
    } catch (error: any) {
      console.error("Error fetching module:", error)
      toast({
        title: "Error",
        description: "Failed to load module. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/modules/${moduleId}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setModule((prev: FormModule | null) =>
          prev
            ? {
                ...prev,
                forms: [data.data, ...prev.forms],
              }
            : null,
        )
        setIsCreateDialogOpen(false)
        setFormData({ name: "", description: "" })
        toast({
          title: "Success",
          description: "Form created successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to create form")
      }
    } catch (error: any) {
      console.error("Error creating form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditForm = async () => {
    if (!editingForm || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/forms/${editingForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setModule((prev: FormModule | null) =>
          prev
            ? {
                ...prev,
                forms: prev.forms.map((f: Form) => (f.id === editingForm.id ? data.data : f)),
              }
            : null,
        )
        setIsEditDialogOpen(false)
        setEditingForm(null)
        setFormData({ name: "", description: "" })
        toast({
          title: "Success",
          description: "Form updated successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to update form")
      }
    } catch (error: any) {
      console.error("Error updating form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setModule((prev: FormModule | null) =>
          prev
            ? {
                ...prev,
                forms: prev.forms.filter((f: Form) => f.id !== formId),
              }
            : null,
        )
        toast({
          title: "Success",
          description: "Form deleted successfully!",
        })
      } else {
        throw new Error(data.error || "Failed to delete form")
      }
    } catch (error: any) {
      console.error("Error deleting form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete form. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (form: Form) => {
    setEditingForm(form)
    setFormData({ name: form.name, description: form.description || "" })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setEditingForm(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading module...</p>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Module not found</h1>
          <p className="mt-2 text-gray-600">The module you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Modules
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">{module.name}</h1>
        {module.description && <p className="text-gray-600 mt-2">{module.description}</p>}
      </div>

      <div className="mb-6">
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
              <DialogDescription>Create a new form within this module.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter form name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter form description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateForm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Form"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {module.forms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first form in this module.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {module.forms.map((form: Form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{form.name}</CardTitle>
                  {form.description && <CardDescription className="mt-1">{form.description}</CardDescription>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(form)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteForm(form.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {form.sections.length} section{form.sections.length !== 1 ? "s" : ""}
                    </Badge>
                    {form.isPublished && (
                      <Badge variant="default" className="bg-green-500">
                        <Globe className="mr-1 h-3 w-3" />
                        Published
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {form.recordCount || 0} record{(form.recordCount || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/builder/${form.id}`} className="flex-1">
                    <Button className="w-full">Edit Form</Button>
                  </Link>
                  {form.isPublished && form.formUrl && (
                    <Link href={form.formUrl} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Form Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
            <DialogDescription>Update the form details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter form name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter form description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditForm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Form"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
