// Shared types for the parent module and its submodules
export interface ModuleConfig {
  name: string
  description?: string
  version: string
  dependencies?: string[]
}

export interface SubmoduleConfig extends ModuleConfig {
  parentModule: string
  path: string
}

export interface TreeViewProps {
  modules: any[]
  onEditModule: (module: any) => void
  onDeleteModule: (moduleId: string) => void
  onCreateSubModule: (parentId: string) => void
  onCreateForm?: (moduleId: string) => void
}

export interface SidebarProps extends TreeViewProps {
  // Additional sidebar-specific props
}

export interface DatabaseConfig {
  connectionString?: string
  provider: 'prisma' | 'supabase' | 'custom'
  options?: Record<string, any>
}