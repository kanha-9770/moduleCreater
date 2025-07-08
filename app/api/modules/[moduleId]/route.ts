import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-service'

export async function GET(
  request: NextRequest, 
  { params }: { params: { moduleId: string } }
) {
  try {
    const module = await DatabaseService.getModule(params.moduleId)
    
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: module,
    })
  } catch (error: any) {
    console.error('Error fetching module:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch module',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { moduleId: string } }
) {
  try {
    const data = await request.json()
    
    const updatedModule = await DatabaseService.updateModule(params.moduleId, data)

    return NextResponse.json({
      success: true,
      data: updatedModule,
    })
  } catch (error: any) {
    console.error('Error updating module:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update module',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { moduleId: string } }
) {
  try {
    console.log('Deleting module with ID:', params.moduleId)
    
    if (!params.moduleId) {
      throw new Error('Module ID is required')
    }

    await DatabaseService.deleteModule(params.moduleId)

    return NextResponse.json({
      success: true,
      message: `Module ${params.moduleId} deleted successfully`,
    })
  } catch (error: any) {
    console.error('Error deleting module:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete module',
      },
      { status: 500 }
    )
  }
}