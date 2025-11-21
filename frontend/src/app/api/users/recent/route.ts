import { NextResponse } from 'next/server'

/**
 * API Route: GET /api/users/recent
 * 
 * Trả về danh sách users gần đây cho UsersTableWidget.
 * Trong thực tế, sẽ query từ database.
 */
export async function GET() {
  try {
    // Mock data - trong thực tế sẽ query từ database
    const recentUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        status: 'active',
        lastActive: '2 hours ago',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'User',
        status: 'active',
        lastActive: '5 hours ago',
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'User',
        status: 'inactive',
        lastActive: '1 day ago',
      },
      {
        id: '4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        role: 'Moderator',
        status: 'active',
        lastActive: '30 minutes ago',
      },
      {
        id: '5',
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        role: 'User',
        status: 'pending',
        lastActive: '3 days ago',
      },
    ]

    return NextResponse.json(recentUsers)
  } catch (error) {
    console.error('Error fetching recent users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent users' },
      { status: 500 }
    )
  }
}




