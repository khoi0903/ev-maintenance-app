'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register as apiRegister, login } from '@/lib/authClient' // ⬅️ dùng client đã tạo

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) newErrors.fullName = 'Tên đầy đủ là bắt buộc'
    if (!username.trim()) newErrors.username = 'Tên tài khoản là bắt buộc'

    if (!password) newErrors.password = 'Mật khẩu là bắt buộc'
    else if (password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'

    if (!confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email không hợp lệ'
    if (phone && !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    if (!validateForm()) return

    setLoading(true)
    try {
      // 1) Gọi API đăng ký (role mặc định Customer ở BE)
      await apiRegister({
        username,
        password,
        fullName,
        email: email || null,
        phone: phone || null,
        address: null,
        role: 'Customer',
      })

      // 2) Đăng nhập luôn để lấy token + user
      const user = await login(username, password)

      // 3) Điều hướng theo role
      if (['Admin', 'Staff', 'Technician'].includes(user.Role)) {
        router.replace('/admin/dashboard')
      } else {
        router.replace('/user/service')
      }
    } catch (err: any) {
      setApiError(err?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <section className="relative z-10 overflow-hidden min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full max-w-[600px] rounded-lg bg-white dark:bg-gray-800 shadow-lg px-6 py-10 sm:p-[60px]">
            {/* Header */}
            <div className="mb-8 text-center">
              <h3 className="mb-2 text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Tạo Tài khoản Khách hàng Mới
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                EV Maintenance Service Center
              </p>
            </div>

            {apiError && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* FullName - Required */}
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Tên Đầy đủ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: '' }) }}
                  placeholder="Nhập tên đầy đủ của bạn"
                  required
                  className={`w-full rounded-sm border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600`}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
              </div>

              {/* Username - Required */}
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Tên Tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }) }}
                  placeholder="Nhập tên tài khoản"
                  required
                  className={`w-full rounded-sm border ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600`}
                />
                {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
              </div>

              {/* Password - Required */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }) }}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  required
                  className={`w-full rounded-sm border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600`}
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password - Required */}
              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Xác nhận Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }) }}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className={`w-full rounded-sm border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600`}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Phone - Optional */}
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Số điện thoại <span className="text-gray-500 text-xs">(Tùy chọn)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: '' }) }}
                  placeholder="Nhập số điện thoại"
                  className={`w-full rounded-sm border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              {/* Email - Optional */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Email <span className="text-gray-500 text-xs">(Tùy chọn)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }) }}
                  placeholder="Nhập email của bạn"
                  className={`w-full rounded-sm border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-sm bg-green-600 px-9 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>
              </div>
            </form>

            {/* Footer Link */}
            <p className="mt-6 text-center text-base font-medium text-gray-600 dark:text-gray-400">
              Đã có tài khoản?{' '}
              <Link href="/signin" className="text-green-600 hover:text-green-700 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
