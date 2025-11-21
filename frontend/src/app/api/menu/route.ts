import { NextResponse } from 'next/server'
import { sidebarMenuConfig } from '@/config/dashboard.config'

/**
 * API Route: GET /api/menu
 * 
 * Trả về danh sách menu items cho sidebar.
 * Có thể customize logic để filter theo user role hoặc permissions.
 */
export async function GET() {
  try {
    // Có thể thêm logic để:
    // - Load từ database
    // - Filter theo user role/permissions
    // - Add dynamic badges/counts
    
    return NextResponse.json(sidebarMenuConfig)
  } catch (error) {
    console.error('Error fetching menu config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu config' },
      { status: 500 }
    )
  }
}




