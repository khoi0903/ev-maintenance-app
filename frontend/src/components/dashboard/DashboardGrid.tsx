'use client'

import React, { useState, useEffect } from 'react'
import { WidgetConfig } from '@/config/dashboard.config'
import WidgetRegistry from '../widgets/WidgetRegistry'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { http } from '@/lib/api'
import type { ApiResp } from '@/types/common'

interface DashboardGridProps {
  widgets: WidgetConfig[]
  onWidgetToggle?: (widgetId: string, visible: boolean) => void
}

/**
 * Dashboard Grid Component - Grid system để hiển thị widgets
 * 
 * @param widgets - Danh sách widget configs
 * @param onWidgetToggle - Callback khi toggle widget visibility
 */
export default function DashboardGrid({ 
  widgets, 
  onWidgetToggle 
}: DashboardGridProps) {
  const [widgetData, setWidgetData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [collapsedWidgets, setCollapsedWidgets] = useState<Set<string>>(new Set())

  /**
   * Fetch data cho widget từ API
   */
  useEffect(() => {
    const fetchWidgetData = async () => {
      for (const widget of widgets) {
        // Chỉ fetch nếu có dataSource và chưa fetch lần nào
        if (widget.dataSource && !(widget.id in widgetData)) {
          setLoading((prev) => ({ ...prev, [widget.id]: true }))
          
          try {
            // Sử dụng http wrapper để có đúng BASE_URL và authentication
            // widget.dataSource nên là đường dẫn bắt đầu bằng '/' như '/workorders' hoặc '/appointments'
            const path = widget.dataSource && widget.dataSource.startsWith('/')
              ? widget.dataSource
              : `/${widget.dataSource}`

            const result = await http.get<ApiResp<any[]>>(path)
            
            // Lấy data từ response (ApiResp có success và data)
            const data = result.success ? result.data : undefined
            
            setWidgetData((prev) => ({ ...prev, [widget.id]: data }))
          } catch (error) {
            console.error(`Error fetching data for widget ${widget.id}:`, error)
            // Nếu lỗi, set undefined để widget dùng default data
            setWidgetData((prev) => ({ ...prev, [widget.id]: undefined }))
          } finally {
            setLoading((prev) => ({ ...prev, [widget.id]: false }))
          }
        } else if (!widget.dataSource) {
          // Nếu không có dataSource, không cần loading
          setLoading((prev) => ({ ...prev, [widget.id]: false }))
        }
      }
    }

    fetchWidgetData()
    // Chỉ chạy khi widgets thay đổi, không phụ thuộc vào widgetData để tránh loop
  }, [widgets])

  /**
   * Toggle widget collapse
   */
  const toggleWidgetCollapse = (widgetId: string) => {
    setCollapsedWidgets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId)
      } else {
        newSet.add(widgetId)
      }
      return newSet
    })
  }

  /**
   * Filter visible widgets - đảm bảo widgets không null
   */
  const visibleWidgets = (widgets && Array.isArray(widgets)) 
    ? widgets.filter((widget) => widget && widget.visible !== false)
    : []

  return (
    <div className="grid grid-cols-12 gap-6">
      {visibleWidgets.map((widget) => {
        const isCollapsed = collapsedWidgets.has(widget.id)
        const isLoading = loading[widget.id]
        const gridCols = widget.gridCols || 12

        return (
          <div
            key={widget.id}
            className={cn(
              'transition-all duration-300',
              isCollapsed && 'h-auto'
            )}
            style={{
              gridColumn: `span ${gridCols}`,
              gridRow: isCollapsed ? 'span 1' : `span ${widget.gridRows || 2}`,
            }}
          >
            <div className={cn(
              'h-full transition-all',
              isCollapsed && 'h-auto'
            )}>
              {isLoading ? (
                <div className="p-8 border rounded-lg bg-card flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  {widget.collapsible && (
                    <div className="mb-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWidgetCollapse(widget.id)}
                      >
                        {isCollapsed ? '▼' : '▲'}
                      </Button>
                    </div>
                  )}
                  {!isCollapsed && (
                    <WidgetRegistry
                      config={widget}
                      data={widgetData[widget.id]}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {visibleWidgets.length === 0 && (
        <div className="col-span-12 text-center py-12">
          <p className="text-muted-foreground">No widgets configured</p>
        </div>
      )}
    </div>
  )
}

