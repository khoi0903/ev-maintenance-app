import { NextResponse } from 'next/server'
import { dashboardWidgetsConfig } from '@/config/dashboard.config'

/**
 * API Route: GET /api/dashboard/widgets
 * 
 * Trả về danh sách widget config cho dashboard.
 * Có thể customize logic để filter, sort, hoặc load từ database.
 */
export async function GET() {
  try {
    // Có thể thêm logic để:
    // - Load từ database
    // - Filter theo user permissions
    // - Sort theo user preferences
    
    return NextResponse.json(dashboardWidgetsConfig)
  } catch (error) {
    console.error('Error fetching widgets config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch widgets config' },
      { status: 500 }
    )
  }
}




