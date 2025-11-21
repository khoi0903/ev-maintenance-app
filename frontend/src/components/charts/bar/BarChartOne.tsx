'use client'

import React from 'react'
import { ApexOptions } from 'apexcharts'
import dynamic from 'next/dynamic'

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
})

interface BarChartOneProps {
  series?: Array<{
    name: string
    data: number[]
  }>
  options?: Partial<ApexOptions>
  height?: number
  categories?: string[]
}

/**
 * BarChartOne Component - Bar chart với ApexCharts
 */
export default function BarChartOne({
  series,
  options,
  height = 180,
  categories,
}: BarChartOneProps) {
  const defaultOptions: ApexOptions = {
    colors: ['#465fff'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      height: height,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '39%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ['transparent'],
    },
    xaxis: {
      categories:
        categories ||
        [
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
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Outfit',
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
    ...options,
  }

  const defaultSeries = [
    {
      name: 'Sales',
      data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
    },
  ]

  return (
    <div className="max-w-full overflow-x-auto">
      <div id="chartBar" className="min-w-[1000px]">
        <ReactApexChart
          options={defaultOptions}
          series={series || defaultSeries}
          type="bar"
          height={height}
        />
      </div>
    </div>
  )
}


