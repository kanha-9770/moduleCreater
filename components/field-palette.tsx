"use client"

import type React from "react"
import { useDraggable } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Type,
  Mail,
  Hash,
  Calendar,
  Clock,
  List,
  CheckSquare,
  ToggleLeft,
  FileSlidersIcon as Slider,
  Upload,
  Eye,
  Lock,
  Star,
  Link,
  Phone,
  FileText,
  Search,
} from "lucide-react"

interface FieldType {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  category: string
}

const fieldTypes: FieldType[] = [
  {
    id: "text",
    label: "Text Input",
    icon: <Type className="w-4 h-4" />,
    description: "Single line text input",
    category: "Basic",
  },
  {
    id: "textarea",
    label: "Text Area",
    icon: <FileText className="w-4 h-4" />,
    description: "Multi-line text input",
    category: "Basic",
  },
  {
    id: "email",
    label: "Email",
    icon: <Mail className="w-4 h-4" />,
    description: "Email address input",
    category: "Basic",
  },
  {
    id: "number",
    label: "Number",
    icon: <Hash className="w-4 h-4" />,
    description: "Numeric input",
    category: "Basic",
  },
  {
    id: "tel",
    label: "Phone",
    icon: <Phone className="w-4 h-4" />,
    description: "Phone number input",
    category: "Basic",
  },
  {
    id: "url",
    label: "URL",
    icon: <Link className="w-4 h-4" />,
    description: "Website URL input",
    category: "Basic",
  },
  {
    id: "password",
    label: "Password",
    icon: <Lock className="w-4 h-4" />,
    description: "Password input field",
    category: "Basic",
  },
  {
    id: "date",
    label: "Date",
    icon: <Calendar className="w-4 h-4" />,
    description: "Date picker",
    category: "Date & Time",
  },
  {
    id: "datetime",
    label: "Date & Time",
    icon: <Clock className="w-4 h-4" />,
    description: "Date and time picker",
    category: "Date & Time",
  },
  {
    id: "select",
    label: "Dropdown",
    icon: <List className="w-4 h-4" />,
    description: "Single selection dropdown",
    category: "Selection",
  },
  {
    id: "radio",
    label: "Radio Buttons",
    icon: <CheckSquare className="w-4 h-4" />,
    description: "Single choice from options",
    category: "Selection",
  },
  {
    id: "checkbox",
    label: "Checkboxes",
    icon: <CheckSquare className="w-4 h-4" />,
    description: "Multiple choice options",
    category: "Selection",
  },
  {
    id: "switch",
    label: "Toggle Switch",
    icon: <ToggleLeft className="w-4 h-4" />,
    description: "On/off toggle",
    category: "Selection",
  },
  {
    id: "slider",
    label: "Slider",
    icon: <Slider className="w-4 h-4" />,
    description: "Range slider input",
    category: "Advanced",
  },
  {
    id: "file",
    label: "File Upload",
    icon: <Upload className="w-4 h-4" />,
    description: "File upload field",
    category: "Advanced",
  },
  {
    id: "rating",
    label: "Rating",
    icon: <Star className="w-4 h-4" />,
    description: "Star rating input",
    category: "Advanced",
  },
  {
    id: "hidden",
    label: "Hidden Field",
    icon: <Eye className="w-4 h-4" />,
    description: "Hidden form field",
    category: "Advanced",
  },
  {
    id: "lookup",
    label: "Lookup",
    icon: <Search className="w-4 h-4" />,
    description: "Dynamic data lookup",
    category: "Advanced",
  },
]

interface DraggableFieldProps {
  fieldType: FieldType
}

function DraggableField({ fieldType }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: fieldType.id,
    data: {
      isPaletteItem: true,
      fieldType: fieldType.id,
    },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1,
      }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab hover:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        isDragging
          ? "shadow-2xl scale-110 rotate-6 border-2 border-blue-400 bg-blue-50 z-50"
          : "border-gray-200 hover:border-blue-300"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex-shrink-0 p-2 rounded-md transition-colors ${isDragging ? "bg-blue-200" : "bg-gray-100"}`}
          >
            {fieldType.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{fieldType.label}</h4>
            <p className="text-xs text-gray-500 truncate">{fieldType.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FieldPalette() {
  const categories = Array.from(new Set(fieldTypes.map((field) => field.category)))

  return (
    <div className="h-full flex flex-col bg-white border-r">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg">Field Palette</CardTitle>
        <p className="text-sm text-gray-600">Drag fields to add them to your form</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6 p-4">
        {categories.map((category) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2">
              <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
              <Badge variant="outline" className="text-xs">
                {fieldTypes.filter((field) => field.category === category).length}
              </Badge>
            </div>
            <div className="space-y-2">
              {fieldTypes
                .filter((field) => field.category === category)
                .map((fieldType) => (
                  <DraggableField key={fieldType.id} fieldType={fieldType} />
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </div>
  )
}
