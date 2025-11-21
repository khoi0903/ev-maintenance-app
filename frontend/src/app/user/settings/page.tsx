'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'

/**
 * User Settings Page - Trang cài đặt tài khoản cho Customer
 */
export default function UserSettingsPage() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [preferences, setPreferences] = useState({
    language: 'vi',
    theme: 'system',
    emailNotifications: true,
    smsNotifications: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      setLoading(false)
      return
    }

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setSaved(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      setError(error.message || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Save preferences to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý cài đặt tài khoản và tùy chọn của bạn
        </p>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>
            Cập nhật mật khẩu để bảo vệ tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {saved && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Đã đổi mật khẩu thành công!
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
            </div>

            <div>
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tùy chọn</CardTitle>
          <CardDescription>
            Cấu hình ngôn ngữ, giao diện và thông báo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreferencesSubmit} className="space-y-6">
            <div>
              <Label htmlFor="language">Ngôn ngữ</Label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <Label htmlFor="theme">Giao diện</Label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="system">Theo hệ thống</option>
                <option value="light">Sáng</option>
                <option value="dark">Tối</option>
              </select>
            </div>

            <div className="space-y-3">
              <Label>Thông báo</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Thông báo qua Email</span>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Thông báo qua SMS</span>
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
              </div>
            </div>

            {saved && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Đã lưu tùy chọn thành công!
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? 'Đang lưu...' : 'Lưu tùy chọn'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

