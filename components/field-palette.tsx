"use client"

import { useDraggable } from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Calendar,
  CheckSquare,
  Radio,
  ChevronDown,
  Upload,
  Search,
  Phone,
  Link,
  Star,
  Clock,
  MapPin,
  User,
  CreditCard,
  ImageIcon,
} from "lucide-react"

export const fieldTypes = [
  {
    id: "text",
    name: "Text Input",
    icon: Type,
    category: "Basic",
    description: "Single line text input",
  },
  {
    id: "textarea",
    name: "Text Area",
    icon: AlignLeft,
    category: "Basic",
    description: "Multi-line text input",
  },
  {
    id: "number",
    name: "Number",
    icon: Hash,
    category: "Basic",
    description: "Numeric input field",
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    category: "Basic",
    description: "Email address input",
  },
  {
    id: "phone",
    name: "Phone",
    icon: Phone,
    category: "Basic",
    description: "Phone number input",
  },
  {
    id: "url",
    name: "URL",
    icon: Link,
    category: "Basic",
    description: "Website URL input",
  },
  {
    id: "date",
    name: "Date",
    icon: Calendar,
    category: "Basic",
    description: "Date picker field",
  },
  {
    id: "time",
    name: "Time",
    icon: Clock,
    category: "Basic",
    description: "Time picker field",
  },
  {
    id: "checkbox",
    name: "Checkbox",
    icon: CheckSquare,
    category: "Choice",
    description: "Single checkbox",
  },
  {
    id: "radio",
    name: "Radio Buttons",
    icon: Radio,
    category: "Choice",
    description: "Multiple choice (single select)",
  },
  {
    id: "select",
    name: "Dropdown",
    icon: ChevronDown,
    category: "Choice",
    description: "Dropdown select list",
  },
  {
    id: "file",
    name: "File Upload",
    icon: Upload,
    category: "Advanced",
    description: "Upload files",
  },
  {
    id: "lookup",
    name: "Lookup",
    icon: Search,
    category: "Advanced",
    description: "Reference data from other sources",
  },
  {
    id: "rating",
    name: "Rating",
    icon: Star,
    category: "Advanced",
    description: "Star rating input",
  },
  {
    id: "location",
    name: "Location",
    icon: MapPin,
    category: "Advanced",
    description: "Geographic location picker",
  },
  {
    id: "signature",
    name: "Signature",
    icon: User,
    category: "Advanced",
    description: "Digital signature pad",
  },
  {
    id: "payment",
    name: "Payment",
    icon: CreditCard,
    category: "Advanced",
    description: "Payment processing field",
  },
  {
    id: "image",
    name: "Image",
    icon: ImageIcon,
    category: "Media",
    description: "Image upload field",
  },
]

interface PaletteItemProps {
  fieldType: (typeof fieldTypes)[0]
}

function PaletteItem({ fieldType }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: fieldType.id,
    data: {
      type: "PaletteItem",
      isPaletteItem: true,
      fieldType: fieldType.id,
    },
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : 1,
  }

  const IconComponent = fieldType.icon

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab hover:cursor-grabbing transition-all duration-200 hover:shadow-md hover:scale-105 border-gray-200 ${
        isDragging ? "shadow-2xl scale-110 rotate-3 border-blue-400 bg-blue-50" : "hover:border-blue-300"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <IconComponent className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fieldType.name}</p>
            <p className="text-xs text-gray-500 truncate">{fieldType.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PaletteItemDragOverlay({ fieldType }: { fieldType: (typeof fieldTypes)[0] }) {
  const IconComponent = fieldType.icon

  return (
    <Card className="palette-item-drag-overlay border-2 border-blue-500 shadow-2xl bg-blue-50 rotate-6 scale-110 z-[9999]">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
            <IconComponent className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900">{fieldType.name}</p>
            <p className="text-sm text-blue-700">{fieldType.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FieldPalette() {
  const categories = Array.from(new Set(fieldTypes.map((ft) => ft.category)))

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Field Palette</h2>
        <p className="text-sm text-gray-600 mt-1">Drag fields to add them to your form</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">{category}</h3>
              <Badge variant="secondary" className="text-xs">
                {fieldTypes.filter((ft) => ft.category === category).length}
              </Badge>
            </div>
            <div className="space-y-2">
              {fieldTypes
                .filter((ft) => ft.category === category)
                .map((fieldType) => (
                  <PaletteItem key={fieldType.id} fieldType={fieldType} />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Drag any field type to the form canvas to add it to a section
        </p>
      </div>
    </div>
  )
}
