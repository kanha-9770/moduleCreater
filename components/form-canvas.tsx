"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Loader2 } from "lucide-react"
import SectionComponent from "./section-component"
import type { Form, FormSection, FormField } from "@/types/form-builder"
import { useToast } from "@/hooks/use-toast"

interface FormCanvasProps {
  form: Form
  onFormUpdate: (form: Form) => void
}

export default function FormCanvas({ form, onFormUpdate }: FormCanvasProps) {
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [deletingSections, setDeletingSections] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const { setNodeRef, isOver } = useDroppable({
    id: "form-canvas",
    data: {
      type: "Canvas",
    },
  })

  const addSection = async () => {
    setIsAddingSection(true)
    try {
      const newSectionData = {
        formId: form.id,
        title: `Section ${form.sections.length + 1}`,
        description: "",
        order: form.sections.length,
        columns: 1,
      }

      // Save section to database
      const response = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSectionData),
      })

      if (!response.ok) throw new Error("Failed to create section")

      const result = await response.json()
      if (result.success) {
        const newSection: FormSection = {
          ...result.data,
          fields: [],
          subforms: [],
          visible: true,
          collapsible: false,
          collapsed: false,
          conditional: null,
          styling: null,
        }

        const updatedForm = {
          ...form,
          sections: [...form.sections, newSection],
        }

        onFormUpdate(updatedForm)
        toast({ title: "Success", description: "Section added successfully" })
      } else {
        throw new Error(result.error || "Failed to create section")
      }
    } catch (error: any) {
      console.error("Error adding section:", error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsAddingSection(false)
    }
  }

  const updateSection = async (sectionId: string, updates: Partial<FormSection>) => {
    try {
      // Update in database
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Update local state with proper ordering
        const updatedSections = form.sections.map((section) =>
          section.id === sectionId ? { ...section, ...updates, updatedAt: new Date() } : section,
        )

        onFormUpdate({
          ...form,
          sections: updatedSections,
        })
      }
    } catch (error) {
      console.error("Error updating section:", error)
      toast({ title: "Error", description: "Failed to update section", variant: "destructive" })
    }
  }

  const deleteSection = async (sectionId: string) => {
    // Add to deleting set for immediate UI feedback
    setDeletingSections((prev) => new Set(prev).add(sectionId))

    try {
      // Delete from database with comprehensive cleanup
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete section from database")
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to delete section")
      }

      // Remove from local state immediately
      const updatedSections = form.sections
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))

      // Update form state immediately
      onFormUpdate({
        ...form,
        sections: updatedSections,
      })

      console.log(`Section deleted successfully. Cleaned up ${result.deletedFieldIds?.length || 0} fields.`)
    } catch (error: any) {
      console.error("Error deleting section:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete section",
        variant: "destructive",
      })
    } finally {
      // Remove from deleting set
      setDeletingSections((prev) => {
        const newSet = new Set(prev)
        newSet.delete(sectionId)
        return newSet
      })
    }
  }

  const updateField = async (fieldId: string, updates: Partial<FormField>) => {
    try {
      // Update in database
      const response = await fetch(`/api/fields/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Update local state with proper ordering
        const updatedSections = form.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) =>
            field.id === fieldId ? { ...field, ...updates, updatedAt: new Date() } : field,
          ),
        }))

        onFormUpdate({
          ...form,
          sections: updatedSections,
        })
      }
    } catch (error) {
      console.error("Error updating field:", error)
      toast({ title: "Error", description: "Failed to update field", variant: "destructive" })
    }
  }

  const deleteField = async (fieldId: string) => {
    try {
      // Delete from database
      const response = await fetch(`/api/fields/${fieldId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Update local state and reorder remaining fields
        const updatedSections = form.sections.map((section) => {
          const updatedFields = section.fields
            .filter((field) => field.id !== fieldId)
            .map((field, index) => ({ ...field, order: index }))

          // Update field orders in database for this section
          updatedFields.forEach((field) => {
            fetch(`/api/fields/${field.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order: field.order }),
            })
          })

          return {
            ...section,
            fields: updatedFields,
          }
        })

        onFormUpdate({
          ...form,
          sections: updatedSections,
        })

        toast({ title: "Success", description: "Field deleted successfully" })
      }
    } catch (error) {
      console.error("Error deleting field:", error)
      toast({ title: "Error", description: "Failed to delete field", variant: "destructive" })
    }
  }

  // Filter out sections that are being deleted
  const visibleSections = form.sections.filter((section) => !deletingSections.has(section.id))

  return (
    <div
      ref={setNodeRef}
      className={`p-6 min-h-full transition-all duration-200 ${isOver ? "bg-blue-50 border-2 border-dashed border-blue-300" : ""
        }`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Form Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
          {form.description && <p className="text-gray-600 mt-2">{form.description}</p>}
        </div>

        {/* Form Sections */}
        {visibleSections.length > 0 ? (
          <SortableContext items={visibleSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {visibleSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SectionComponent
                    key={section.id}
                    section={section}
                    onUpdateSection={(updates) => updateSection(section.id, updates)}
                    onDeleteSection={() => deleteSection(section.id)}
                    onUpdateField={updateField}
                    onDeleteField={deleteField}
                    isDeleting={deletingSections.has(section.id)}
                  />
                ))}
            </div>
          </SortableContext>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-12 text-center">
              <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No sections yet</h3>
              <p className="text-gray-500 mb-6">Add your first section to start building your form</p>
              <Button onClick={addSection} disabled={isAddingSection}>
                <Plus className="w-4 h-4 mr-2" />
                {isAddingSection ? "Adding..." : "Add Section"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Section Button */}
        {visibleSections.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button onClick={addSection} disabled={isAddingSection} variant="outline" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {isAddingSection ? "Adding Section..." : "Add Section"}
            </Button>
          </div>
        )}

        {/* Show deletion status */}
        {deletingSections.size > 0 && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center gap-3 text-red-800">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">
                Deleting {deletingSections.size} section{deletingSections.size !== 1 ? "s" : ""}...
              </span>
            </div>
            <p className="text-sm text-red-600 mt-1">Cleaning up fields, records, and lookup relations</p>
          </div>
        )}
      </div>
    </div>
  )
}
