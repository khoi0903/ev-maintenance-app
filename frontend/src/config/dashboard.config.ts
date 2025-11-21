/**
 * Dashboard Configuration
 * 
 * Cấu hình cho sidebar menu và dashboard widgets
 * Có thể load từ API hoặc từ file config này
 */

// Icon types - có thể sử dụng lucide-react hoặc icon custom
export type IconType = string;

/**
 * Menu item configuration cho Sidebar
 */
export interface MenuItem {
  id: string;
  label: string;
  icon?: IconType;
  href: string;
  badge?: number; // Số thông báo
  children?: MenuItem[]; // Submenu
}

/**
 * Widget configuration cho Dashboard
 */
export interface WidgetConfig {
  id: string;
  type: 'analytics' | 'table' | 'chart' | 'notification' | 'events' | 'custom';
  title: string;
  description?: string;
  gridCols?: number; // 1-12 (dựa trên grid 12 columns)
  gridRows?: number; // Chiều cao của widget
  position?: { x: number; y: number }; // Vị trí trong grid
  config?: Record<string, any>; // Config riêng cho từng widget
  dataSource?: string; // API endpoint hoặc data key
  visible?: boolean; // Hiển thị hay ẩn widget
  collapsible?: boolean; // Có thể thu gọn/mở rộng
}

/**
 * Sidebar menu configuration
 * Có thể fetch từ API: fetch('/api/menu')
 */
export const sidebarMenuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    href: '/admin/dashboard',
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    href: '/admin/users',
    badge: 5,
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: 'car',
    href: '/admin/vehicles',
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: 'calendar',
    href: '/admin/appointments',
    badge: 3,
  },
  {
    id: 'work-orders',
    label: 'Work Orders',
    icon: 'task',
    href: '/admin/work-orders',
    badge: 2,
  },
  {
    id: 'my-work-orders',
    label: 'Công việc của tôi',
    icon: 'task',
    href: '/admin/work-orders/technician',
  },
  {
    id: 'parts',
    label: 'Parts & Inventory',
    icon: 'box',
    href: '/admin/parts',
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'services',
    href: '/admin/services',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: 'file-text',
    href: '/admin/invoices',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart',
    href: '/admin/reports',
    children: [
      {
        id: 'reports-analytics',
        label: 'Analytics',
        icon: 'chart-line',
        href: '/admin/reports/analytics',
      },
      {
        id: 'reports-financial',
        label: 'Financial',
        icon: 'dollar',
        href: '/admin/reports/financial',
      },
    ],
  },
];

/**
 * Dashboard widgets configuration
 * Có thể fetch từ API: fetch('/api/dashboard/widgets')
 */
export const dashboardWidgetsConfig: WidgetConfig[] = [
  {
    id: 'analytics-overview',
    type: 'analytics',
    title: 'Analytics Overview',
    description: 'Tổng quan thống kê hệ thống',
    gridCols: 12,
    gridRows: 1,
    config: {
      showChart: true,
      metrics: ['workorders', 'invoices', 'appointments', 'vehicles'],
    },
    dataSource: '/workorders',
    visible: true,
    collapsible: true,
  },
  {
    id: 'work-orders-table',
    type: 'table',
    title: 'Recent Work Orders',
    description: 'Các công việc gần đây',
    gridCols: 6,
    gridRows: 2,
    config: {
      pageSize: 10,
      sortable: true,
      filterable: true,
      dataType: 'workorders',
    },
    dataSource: '/workorders',
    visible: true,
    collapsible: true,
  },
  {
    id: 'appointments-chart',
    type: 'chart',
    title: 'Appointments Status',
    description: 'Tình trạng lịch hẹn',
    gridCols: 6,
    gridRows: 3,
    config: {
      chartType: 'pie',
      period: 'monthly',
    },
    dataSource: '/appointments',
    visible: true,
    collapsible: true,
  },
  {
    id: 'notifications',
    type: 'notification',
    title: 'Notifications',
    description: 'Thông báo hệ thống',
    gridCols: 4,
    gridRows: 2,
    config: {
      maxItems: 5,
      autoRefresh: true,
    },
    dataSource: '/notifications',
    visible: true,
    collapsible: true,
  },
  {
    id: 'recent-events',
    type: 'events',
    title: 'Recent Events',
    description: 'Sự kiện gần đây',
    gridCols: 8,
    gridRows: 2,
    config: {
      maxItems: 10,
      showTimestamp: true,
    },
    dataSource: '/workorders',
    visible: true,
    collapsible: true,
  },
];

/**
 * Fetch widgets config từ API
 * Fallback về config tĩnh nếu API lỗi
 */
export async function getDashboardWidgetsConfig(): Promise<WidgetConfig[]> {
  // Nếu đang ở server-side hoặc API không available, dùng static config
  if (typeof window === 'undefined') {
    return dashboardWidgetsConfig;
  }

  try {
    const response = await fetch('/api/dashboard/widgets', {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.warn('Failed to fetch widgets config from API, using static config', error);
  }
  return dashboardWidgetsConfig;
}

/**
 * Fetch menu config từ API
 * Fallback về config tĩnh nếu API lỗi
 */
export async function getSidebarMenuConfig(): Promise<MenuItem[]> {
  // Nếu đang ở server-side hoặc API không available, dùng static config
  if (typeof window === 'undefined') {
    return sidebarMenuConfig;
  }

  try {
    const response = await fetch('/api/menu', {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.warn('Failed to fetch menu config from API, using static config', error);
  }
  return sidebarMenuConfig;
}

