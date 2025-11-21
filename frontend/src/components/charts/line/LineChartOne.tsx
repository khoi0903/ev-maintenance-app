'use client'

import React from 'react'
import { ApexOptions } from 'apexcharts'
import dynamic from 'next/dynamic'

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

interface LineChartOneProps {
  series?: Array<{
    name: string
    data: number[]
  }>
  options?: Partial<ApexOptions>
  height?: number
}

/**
 * LineChartOne Component - Line chart với ApexCharts
 */
export default function LineChartOne({
  series,
  options,
  height = 310,
}: LineChartOneProps) {
  const defaultOptions: ApexOptions = {
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#465FFF', '#9CB9FF'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      height: height,
      type: 'line',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'straight',
      width: [2, 2],
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: 'dd MMM yyyy',
      },
    },
    xaxis: {
      type: 'category',
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: ['#6B7280'],
        },
      },
      title: {
        text: '',
        style: {
          fontSize: '0px',
        },
      },
    },
    ...options,
  }

  const defaultSeries = [
    {
      name: 'Sales',
      data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
    },
    {
      name: 'Revenue',
      data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140],
    },
  ]

  return (
    <div className="max-w-full overflow-x-auto">
      <div id="chartLine" className="min-w-[1000px]">
        <ReactApexChart
          options={defaultOptions}
          series={series || defaultSeries}
          type="area"
          height={height}
        />
      </div>
    </div>
  )
}


