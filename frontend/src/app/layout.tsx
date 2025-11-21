import type { Metadata } from 'next'
import React from 'react'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EV Maintenance Admin Dashboard',
  description: 'Admin dashboard for EV Maintenance Application',
}

/**
 * Root Layout - Layout gốc cho toàn bộ ứng dụng
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}

