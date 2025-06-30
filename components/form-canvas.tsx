"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Layers } from "lucide-react"
import SectionComponent from "./section-component"
import type { Form, FormSection, FormField } from "@/types/form-builder"
import { useToast } from "@/hooks/use-toast"

interface FormCanvasProps {
  form: Form
  onFormUpdate: (form: Form) => void
}

export default function FormCanvas({ form, onFormUpdate }: FormCanvasProps) {
  const [isAddingSection, setIsAddingSection] = useState(false)
  const { toast } = useToast()

  const { setNodeRef } = useDroppable({
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
        // Update local state
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
    try {
      // Delete from database
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Update local state
        const updatedSections = form.sections.filter((section) => section.id !== sectionId)
        onFormUpdate({
          ...form,
          sections: updatedSections,
        })
        toast({ title: "Success", description: "Section deleted successfully" })
      }
    } catch (error) {
      console.error("Error deleting section:", error)
      toast({ title: "Error", description: "Failed to delete section", variant: "destructive" })
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
        // Update local state
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
        // Update local state
        const updatedSections = form.sections.map((section) => ({
          ...section,
          fields: section.fields.filter((field) => field.id !== fieldId),
        }))

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

  return (
    <div ref={setNodeRef} className="p-6 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Form Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
          {form.description && <p className="text-gray-600 mt-2">{form.description}</p>}
        </div>

        {/* Form Sections */}
        {form.sections.length > 0 ? (
          <SortableContext items={form.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {form.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SectionComponent
                    key={section.id}
                    section={section}
                    onUpdateSection={(updates) => updateSection(section.id, updates)}
                    onDeleteSection={() => deleteSection(section.id)}
                    onUpdateField={updateField}
                    onDeleteField={deleteField}
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
        {form.sections.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button onClick={addSection} disabled={isAddingSection} variant="outline" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {isAddingSection ? "Adding Section..." : "Add Section"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
