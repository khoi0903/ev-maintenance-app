'use client'

import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import HomepageHeader from './HomepageHeader'

/**
 * EVMaintenanceHomepage Component - Trang chủ tối giản với video nền
 * 
 * Thiết kế tối giản với video background full-screen
 * Video tự động phát, lặp lại và tắt tiếng
 */
export default function EVMaintenanceHomepage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Force video to load and play
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error)
      })
    }

    // Check if user is logged in and get role
    const checkAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          setIsLoggedIn(true)
          setUserRole(user.Role || user.role || null)
        } catch (error) {
          console.error('Error parsing user data:', error)
          setIsLoggedIn(false)
          setUserRole(null)
        }
      } else {
        setIsLoggedIn(false)
        setUserRole(null)
      }
    }

    checkAuth()
    // Listen for storage changes (in case of logout/login in other tabs)
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const handleCTAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      e.preventDefault()
      router.push('/signin')
    } else {
      // User is logged in, navigate based on role
      e.preventDefault()
      if (userRole === 'Admin' || userRole === 'Staff' || userRole === 'Technician') {
        router.push('/admin/dashboard')
      } else {
        router.push('/user/service')
      }
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Video - Full Screen */}
      <video
        ref={videoRef}
        className="absolute inset-0 object-cover w-full h-full z-0"
        src="/videos/evmaintenanceapp.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onError={(e) => {
          console.error('Video loading error:', e)
        }}
        onLoadedData={() => {
          console.log('Video loaded successfully')
          if (videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.error('Error playing video after load:', error)
            })
          }
        }}
      />

      {/* Dark Overlay - z-index: 10 */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content Container - z-index: 20 */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header - Fixed Top */}
        <HomepageHeader />

        {/* Hero Content - Center */}
        <main className="flex-1 flex items-center justify-center px-8">
          <div className="text-center max-w-5xl mx-auto z-20">
            {/* Primary Title - EV MAINTENANCE SERVICE CENTER */}
            <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
              EV MAINTENANCE SERVICE CENTER
            </h1>

            {/* Secondary Title / Slogan */}
            <h2 className="text-white text-xl md:text-2xl font-light mb-10 leading-relaxed" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
              An tâm trên mọi hành trình.
            </h2>

                {/* CTA Button - Green Background */}
                <Link
                  href={isLoggedIn ? ((userRole === 'Admin' || userRole === 'Staff' || userRole === 'Technician') ? '/admin/dashboard' : '/user/service') : '/signin'}
                  onClick={handleCTAClick}
              className={cn(
                'inline-block px-8 py-4 bg-green-600 hover:bg-green-700',
                'text-white font-semibold text-lg rounded-lg uppercase',
                'transition-all duration-300 transform hover:scale-105',
                'shadow-lg hover:shadow-xl'
              )}
              style={{ fontFamily: 'var(--font-inter), sans-serif' }}
            >
              ĐẶT LỊCH NGAY
            </Link>
          </div>
        </main>

        {/* Footer - Bottom */}
        <footer className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6">
          {/* Left Link */}
          <Link
            href="#about"
            className="text-white hover:text-opacity-80 transition-colors font-medium text-sm uppercase tracking-wider"
          >
            TÌM HIỂU THÊM
          </Link>

          {/* Right Link */}
          <Link
            href="#contact"
            className="text-white hover:text-opacity-80 transition-colors font-medium text-sm uppercase tracking-wider"
          >
            LIÊN HỆ
          </Link>
        </footer>
      </div>
    </div>
  )
}


