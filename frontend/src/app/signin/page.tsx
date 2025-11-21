'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/authClient' // ⬅️ gọi API BE /auth/login

export default function SigninPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Gọi API thật
      const user = await login(email, password) // BE nhận Username, bạn đang dùng email làm username

      // Xử lý rememberMe:
      // - login() lưu mặc định vào localStorage
      // - nếu KHÔNG tick "Ghi nhớ đăng nhập" → chuyển token/user sang sessionStorage
      if (!rememberMe && typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (token) sessionStorage.setItem('token', token)
        if (userStr) sessionStorage.setItem('user', userStr)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }

      // Điều hướng theo Role
      if (user.Role === 'Admin' || user.Role === 'Staff' || user.Role === 'Technician') {
        router.push('/admin/dashboard')
      } else {
        router.push('/user/service')
      }
      // Không cần setLoading(false) vì sẽ điều hướng
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <section className="relative z-10 overflow-hidden min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="w-full max-w-[500px] rounded-lg bg-white dark:bg-gray-800 shadow-lg px-6 py-10 sm:p-[60px]">
            <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
              Đăng nhập vào tài khoản
            </h3>
            <p className="mb-11 text-center text-base font-medium text-gray-600 dark:text-gray-400">
              Đăng nhập để sử dụng dịch vụ
            </p>

            <form onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="mb-8">
                <label
                  htmlFor="email"
                  className="mb-3 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Tài Khoản
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập tên tài khoản hoặc Email"
                  required
                  className="w-full rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600"
                />
              </div>

              <div className="mb-8">
                <label
                  htmlFor="password"
                  className="mb-3 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-base text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-green-600 focus:bg-white dark:focus:bg-gray-600"
                />
              </div>

              <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center">
                <div className="mb-4 sm:mb-0">
                  <label
                    htmlFor="rememberMe"
                    className="flex cursor-pointer select-none items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`box mr-4 flex h-5 w-5 items-center justify-center rounded border ${
                          rememberMe ? 'border-green-600 bg-green-600' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {rememberMe && (
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                              fill="white"
                              stroke="white"
                              strokeWidth="0.4"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <div>
                  <Link
                    href="#"
                    className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-sm bg-green-600 px-9 py-4 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </div>
            </form>

            <p className="text-center text-base font-medium text-gray-600 dark:text-gray-400">
              Chưa có tài khoản?{' '}
              <Link href="/signup" className="text-green-600 hover:text-green-700 hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
