import { NextResponse } from 'next/server'

/**
 * API Route: GET /api/dashboard/analytics
 * 
 * Trả về data analytics cho AnalyticsWidget.
 * Trong thực tế, sẽ query từ database.
 */
export async function GET() {
  try {
    // Mock data - trong thực tế sẽ query từ database
    const analyticsData = {
      users: 1250,
      revenue: 45000,
      orders: 320,
      growth: 12.5,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}




