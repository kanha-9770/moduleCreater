import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Creating form record tables and mappings...")

  // Create tables 3-15 (1-2 are created in the migration)
  for (let i = 3; i <= 15; i++) {
    const tableName = `form_records_${i}`
    
    console.log(`Creating table: ${tableName}`)
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
          record_data JSONB DEFAULT '{}',
          employee_id TEXT,
          amount DECIMAL,
          date TIMESTAMP WITH TIME ZONE,
          submitted_by TEXT,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address TEXT,
          user_agent TEXT,
          status TEXT DEFAULT 'submitted',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_${tableName}_form_id ON ${tableName}(form_id);
        CREATE INDEX IF NOT EXISTS idx_${tableName}_submitted_at ON ${tableName}(submitted_at);
        CREATE INDEX IF NOT EXISTS idx_${tableName}_status ON ${tableName}(status);
        CREATE INDEX IF NOT EXISTS idx_${tableName}_employee_id ON ${tableName}(employee_id);
        CREATE INDEX IF NOT EXISTS idx_${tableName}_date ON ${tableName}(date);
      `)
      
      console.log(`Table ${tableName} created successfully`)
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error)
    }
  }

  // Assign existing forms to tables
  const forms = await prisma.form.findMany({
    select: { id: true },
    where: {
      tableMapping: null
    }
  })
  
  console.log(`Found ${forms.length} forms without table mappings`)
  
  for (const form of forms) {
    try {
      await prisma.$queryRaw`SELECT assign_form_to_record_table(${form.id})`
      console.log(`Assigned form ${form.id} to a record table`)
    } catch (error) {
      console.error(`Error assigning form ${form.id} to a record table:`, error)
    }
  }

  console.log("Table generation and mapping complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })