/**
 * User Menu Configuration
 * 
 * Cấu hình menu sidebar cho User Dashboard (Customer)
 */

import { MenuItem } from './dashboard.config'

export const userMenuConfig: MenuItem[] = [
  {
    id: 'user-dashboard',
    label: 'Service',
    icon: 'services',
    href: '/user/service',
  },
  {
    id: 'my-vehicles',
    label: 'My Vehicles',
    icon: 'car',
    href: '/user/vehicles',
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: 'calendar',
    href: '/user/payment',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: 'task',
    href: '/user/progress',
  },
  {
    id: 'profile-settings',
    label: 'Profile Settings',
    icon: 'users',
    href: '/user/profile',
  },
]

