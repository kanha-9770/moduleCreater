"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDrag } from "react-dnd"
import { ItemTypes } from "@/types/form-builder"
import { Card } from "@/components/ui/card"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Radio,
  AlignLeft,
  Calculator,
  TrendingUp,
  Link,
} from "lucide-react"

// Define field types directly here for simplicity
const FIELD_TYPES = [
  { name: "text", label: "Text Input", icon: Type, category: "basic" },
  { name: "textarea", label: "Text Area", icon: AlignLeft, category: "basic" },
  { name: "number", label: "Number Input", icon: Hash, category: "basic" },
  { name: "date", label: "Date Picker", icon: Calendar, category: "basic" },
  { name: "select", label: "Dropdown", icon: List, category: "choice" },
  { name: "checkbox", label: "Checkbox", icon: CheckSquare, category: "choice" },
  { name: "radio", label: "Radio Buttons", icon: Radio, category: "choice" },
  { name: "formula", label: "Formula", icon: Calculator, category: "advanced" },
  { name: "rollup", label: "Rollup", icon: TrendingUp, category: "advanced" },
  { name: "lookup", label: "Lookup", icon: Link, category: "advanced" },
]

const FIELD_CATEGORIES = [
  { id: "basic", name: "Basic Fields" },
  { id: "choice", name: "Choice Fields" },
  { id: "advanced", name: "Advanced Fields" },
]

interface DraggableFieldProps {
  type: string
  label: string
  icon: any
}

function DraggableField({ type, label, icon: Icon }: DraggableFieldProps) {
  const dragRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PALETTE_FIELD,
    item: { type, label },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  // Attach drag to ref
  drag(dragRef)

  return (
    <Card
      ref={dragRef}
      className={`flex cursor-grab flex-col items-center justify-center space-y-1 rounded-md border p-3 text-center text-sm transition-all hover:bg-gray-100 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <Icon className="h-5 w-5 text-gray-600" />
      <span className="text-xs text-gray-700">{label}</span>
    </Card>
  )
}

interface PaletteProps {
  onAddField: (fieldType: string) => void
  onAddSection: () => void
  onAddSubform: () => void
}

export default function Palette({ onAddField, onAddSection, onAddSubform }: PaletteProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["basic", "choice"])

  const filteredFields = FIELD_TYPES.filter((field) => {
    const matchesSearch =
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.label.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || field.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedFields = FIELD_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.id] = {
        ...category,
        fields: filteredFields.filter((field) => field.category === category.id),
      }
      return acc
    },
    {} as Record<string, any>,
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Field Palette</h2>

        {/* Search */}
        <Input
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {FIELD_CATEGORIES.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Field Categories */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {Object.values(groupedFields).map(
            (category: any) =>
              category.fields.length > 0 && (
                <Collapsible
                  key={category.id}
                  open={expandedCategories.includes(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded">
                    <div className="flex items-center gap-2">
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary">{category.fields.length}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid grid-cols-2 gap-2 mt-3 ml-2">
                    {category.fields.map((field: any) => (
                      <DraggableField key={field.name} type={field.name} label={field.label} icon={field.icon} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ),
          )}
        </div>

        {/* Layout Elements */}
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-semibold mb-3">Layout Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-16 text-xs bg-transparent"
              onClick={onAddSection}
            >
              <Layers className="w-5 h-5 mb-1" />
              Section
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-16 text-xs bg-transparent"
              onClick={onAddSubform}
            >
              <Plus className="w-5 h-5 mb-1" />
              Subform
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
