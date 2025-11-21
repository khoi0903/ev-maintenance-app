'use client'

import React from 'react'
import { WidgetConfig } from '@/config/dashboard.config'
import AnalyticsWidget from './AnalyticsWidget'
import UsersTableWidget from './UsersTableWidget'
import ChartWidget from './ChartWidget'
import NotificationWidget from './NotificationWidget'
import RecentEventsWidget from './RecentEventsWidget'

/**
 * Widget Registry - Map widget types to components
 * 
 * Đây là nơi đăng ký tất cả các widget components.
 * Khi thêm widget mới, chỉ cần thêm vào đây.
 */
const widgetComponents: Record<string, React.ComponentType<any>> = {
  analytics: AnalyticsWidget,
  table: UsersTableWidget,
  chart: ChartWidget,
  notification: NotificationWidget,
  events: RecentEventsWidget,
}

interface WidgetRegistryProps {
  config: WidgetConfig
  data?: any
}

/**
 * Widget Registry Component - Render widget dựa trên config
 * 
 * @param config - Widget configuration từ config file hoặc API
 * @param data - Data cho widget (có thể từ props hoặc fetch từ API)
 */
export default function WidgetRegistry({ config, data }: WidgetRegistryProps) {
  const WidgetComponent = widgetComponents[config.type]

  if (!WidgetComponent) {
    console.warn(`Widget type "${config.type}" not found in registry`)
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          Widget type "{config.type}" is not available
        </p>
      </div>
    )
  }

  // Render widget với config và data
  return (
    <WidgetComponent
      config={config.config}
      data={data}
      className="h-full"
    />
  )
}

/**
 * Get widget component by type (for direct usage)
 */
export function getWidgetComponent(type: string) {
  return widgetComponents[type]
}

/**
 * Register a new widget type
 */
export function registerWidget(type: string, component: React.ComponentType<any>) {
  widgetComponents[type] = component
}




