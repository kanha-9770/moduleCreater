"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useParams, notFound } from "next/navigation"
import { Loader2, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Form } from "@/types/form-builder"
import { useToast } from "@/hooks/use-toast"
import { LookupField } from "@/components/lookup-field"

export default function FormPreviewPage() {
  const params = useParams()
  const formId = params.formId as string
  const { toast } = useToast()

  const [form, setForm] = useState<Form | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchForm = useCallback(async () => {
    if (!formId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/forms/${formId}`)
      if (!response.ok) {
        if (response.status === 404) notFound()
        throw new Error("Failed to fetch form data")
      }
      const result = await response.json()
      if (!result.success || !result.data.isPublished) {
        setError("This form is not published or could not be found.")
        return
      }
      setForm(result.data)
      setSubmissionMessage(result.data.submissionMessage || "Thank you for your submission!")

      const initialData: Record<string, any> = {}
      result.data.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.defaultValue) {
            initialData[field.id] = field.defaultValue
          }
        })
      })
      setFormData(initialData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    fetchForm()
  }, [fetchForm])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordData: formData }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to submit form")
      }

      setSubmissionSuccess(true)
      setSubmissionMessage(form.submissionMessage || "Thank you for your submission!")
      setFormData({})
      toast({ title: "Success!", description: "Your form has been submitted." })
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Submission Error", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!form) {
    return notFound()
  }

  const getGridColsClass = (columns: number) => {
    return (
      {
        1: "md:grid-cols-1",
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-4",
      }[columns] || "md:grid-cols-1"
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{form.name}</CardTitle>
          {form.description && <p className="text-muted-foreground">{form.description}</p>}
        </CardHeader>
        <CardContent>
          {submissionSuccess ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-green-600 mb-4">Success!</h3>
              <p className="text-gray-700">{submissionMessage}</p>
              <Button onClick={() => setSubmissionSuccess(false)} className="mt-6">
                Submit Another Response
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.sections
                .filter((s) => s.visible)
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <Card key={section.id} className="border-dashed p-4">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold">{section.title}</CardTitle>
                      {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                    </CardHeader>
                    <CardContent>
                      <div className={`grid gap-4 grid-cols-1 ${getGridColsClass(section.columns)}`}>
                        {section.fields
                          .filter((f) => f.visible)
                          .sort((a, b) => a.order - b.order)
                          .map((field) => (
                            <div key={field.id} className="space-y-2">
                              <Label htmlFor={field.id} className="flex items-center gap-1">
                                {field.label}
                                {field.validation?.required && <span className="text-red-500">*</span>}
                              </Label>
                              {field.type === "text" && (
                                <Input
                                  id={field.id}
                                  value={formData[field.id] || ""}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  readOnly={field.readonly}
                                  placeholder={field.placeholder || ""}
                                />
                              )}
                              {field.type === "textarea" && (
                                <Textarea
                                  id={field.id}
                                  value={formData[field.id] || ""}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  readOnly={field.readonly}
                                  placeholder={field.placeholder || ""}
                                />
                              )}
                              {field.type === "number" && (
                                <Input
                                  id={field.id}
                                  type="number"
                                  value={formData[field.id] || ""}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  readOnly={field.readonly}
                                  placeholder={field.placeholder || ""}
                                />
                              )}
                              {field.type === "date" && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData[field.id] && "text-muted-foreground",
                                      )}
                                      disabled={field.readonly}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {formData[field.id] ? (
                                        format(new Date(formData[field.id]), "PPP")
                                      ) : (
                                        <span>{field.placeholder || "Pick a date"}</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={formData[field.id] ? new Date(formData[field.id]) : undefined}
                                      onSelect={(date) => handleFieldChange(field.id, date?.toISOString())}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                              {field.type === "select" && (
                                <Select
                                  value={formData[field.id] || ""}
                                  onValueChange={(value) => handleFieldChange(field.id, value)}
                                  disabled={field.readonly}
                                >
                                  <SelectTrigger id={field.id}>
                                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.isArray(field.options) &&
                                      field.options.map((option: any) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {field.type === "checkbox" && (
                                <div className="flex items-center space-x-2 pt-2">
                                  <Checkbox
                                    id={field.id}
                                    checked={!!formData[field.id]}
                                    onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                                    disabled={field.readonly}
                                  />
                                  <Label htmlFor={field.id} className="font-normal">
                                    {field.description || "Confirm"}
                                  </Label>
                                </div>
                              )}
                              {field.type === "radio" && (
                                <RadioGroup
                                  value={formData[field.id] || ""}
                                  onValueChange={(value) => handleFieldChange(field.id, value)}
                                  disabled={field.readonly}
                                  className="pt-2"
                                >
                                  {Array.isArray(field.options) &&
                                    field.options.map((option: any) => (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                                        <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                                          {option.label}
                                        </Label>
                                      </div>
                                    ))}
                                </RadioGroup>
                              )}
                              {field.type === "lookup" && (
                                <LookupField
                                  field={{
                                    id: field.id,
                                    label: field.label,
                                    placeholder: field.placeholder || undefined,
                                    description: field.description || undefined,
                                    validation: field.validation || { required: false },
                                    lookup: field.lookup || undefined,
                                  }}
                                  value={formData[field.id]}
                                  onChange={(value) => handleFieldChange(field.id, value)}
                                  disabled={field.readonly}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Submit"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
