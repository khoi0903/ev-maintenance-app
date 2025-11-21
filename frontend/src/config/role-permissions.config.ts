/**
 * Role-Based Permissions Configuration
 * 
 * Cấu hình quyền truy cập menu cho từng role
 */

import { MenuItem } from './dashboard.config'

export type UserRole = 'Admin' | 'Staff' | 'Technician' | 'Customer'

/**
 * Menu IDs được phép cho từng role
 * Staff và Technician chỉ có thể truy cập một số menu nhất định
 */
export const roleMenuPermissions: Record<UserRole, string[]> = {
  Admin: [
    'dashboard',
    'users',
    'vehicles',
    'appointments',
    'work-orders',
    'services',
    'parts',
    'reports',
    'reports-analytics',
    'reports-financial',
  ],
  Staff: [
    'vehicles',
    'appointments',
    'work-orders',
    'services',
    'parts',
    'invoices',
  ],
  Technician: [
    'parts',
    'my-work-orders',
  ],
  Customer: [], // Customer không truy cập admin dashboard
}

/**
 * Filter menu items dựa trên role của user
 * 
 * @param menuItems - Danh sách menu items
 * @param userRole - Role của user
 * @returns Danh sách menu items được phép
 */
export function filterMenuByRole(
  menuItems: MenuItem[],
  userRole: UserRole
): MenuItem[] {
  const allowedMenuIds = roleMenuPermissions[userRole] || []

  return menuItems
    .map((item) => {
      // Nếu menu item có children, filter children trước
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByRole(item.children, userRole)
        
        // Nếu có children được phép, giữ lại menu item cha
        if (filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
          }
        }
        
        // Nếu không có children nào được phép, kiểm tra xem menu cha có được phép không
        if (allowedMenuIds.includes(item.id)) {
          return {
            ...item,
            children: [],
          }
        }
        
        return null
      }

      // Menu item không có children
      if (allowedMenuIds.includes(item.id)) {
        return item
      }

      return null
    })
    .filter((item): item is MenuItem => item !== null)
}

/**
 * Check if user role can access admin dashboard
 * 
 * @param userRole - Role của user
 * @returns true nếu có thể truy cập admin dashboard
 */
export function canAccessAdminDashboard(userRole: UserRole): boolean {
  return ['Admin', 'Staff', 'Technician'].includes(userRole)
}

