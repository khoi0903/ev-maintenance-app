'use client'

import React from 'react'
import Link from 'next/link'

/**
 * HomepageHeader Component - Header cho trang Homepage
 * 
 * Header cố định ở trên cùng với text "Trung tâm bảo hành" ở giữa và 2 nút "Đăng nhập" và "Đăng ký" ở góc phải
 * Header trong suốt với text màu trắng để nổi bật trên video background
 */
export default function HomepageHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-30 flex items-center justify-between px-8 py-6">
      {/* Left Spacer - Để cân bằng layout */}
      <div className="flex-1" />

      {/* Text Logo - Center Alignment (Absolute Center) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
        <h1 className="text-white text-lg md:text-xl font-semibold tracking-wider uppercase drop-shadow-lg">
          Trung tâm bảo hành
        </h1>
      </div>

      {/* Auth Buttons - Right Alignment */}
      <div className="flex-1 flex justify-end items-center gap-4">
        {/* Sign In Button - Text Link */}
        <Link
          href="/signin"
          className="text-white hover:text-opacity-80 transition-colors font-medium"
        >
          Đăng nhập
        </Link>

        {/* Sign Up Button - Text Link */}
        <Link
          href="/signup"
          className="text-white hover:text-opacity-80 transition-colors font-medium"
        >
          Đăng ký
        </Link>
      </div>
    </header>
  )
}

