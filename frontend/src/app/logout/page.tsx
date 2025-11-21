'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Handle logout logic here
    // Clear session, tokens, etc.
    const handleLogout = async () => {
      try {
        // Clear local storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Clear session storage
        sessionStorage.clear()
        
        // Optional: Call logout API
        // await fetch('/api/auth/logout', { method: 'POST' })
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (error) {
        console.error('Logout error:', error)
        // Still redirect even if there's an error
        router.push('/')
      }
    }

    handleLogout()
  }, [router])

  return (
    <section className="relative z-10 overflow-hidden min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full max-w-[500px] rounded-lg bg-white dark:bg-gray-800 shadow-lg px-6 py-10 sm:p-[60px] text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl">
              Đang đăng xuất...
            </h3>
            <p className="mb-8 text-base font-medium text-gray-600 dark:text-gray-400">
              Bạn đang được chuyển hướng về trang chủ
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Nếu không tự động chuyển hướng,{' '}
              <Link href="/" className="text-green-600 hover:text-green-700 hover:underline">
                nhấp vào đây
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

