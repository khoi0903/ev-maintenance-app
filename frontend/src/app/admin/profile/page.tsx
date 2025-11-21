'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/**
 * Profile Page - Trang chỉnh sửa thông tin cá nhân của Admin
 */
export default function ProfilePage() {
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    avatar: '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load user data from storage
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserData({
          fullName: user.FullName || user.fullName || '',
          username: user.Username || user.username || '',
          email: user.Email || user.email || '',
          phone: user.Phone || user.phone || '',
          avatar: user.avatar || '',
        })
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update storage
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const updatedUser = {
          ...user,
          FullName: userData.fullName,
          Email: userData.email,
          Phone: userData.phone,
        }
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage
        storage.setItem('user', JSON.stringify(updatedUser))
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
        <p className="text-muted-foreground mt-2">
          Chỉnh sửa thông tin cá nhân của bạn
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 pb-6 border-b">
              <Avatar className="w-24 h-24">
                <AvatarImage src={userData.avatar} alt={userData.fullName} />
                <AvatarFallback className="text-2xl">
                  {getInitials(userData.fullName || 'User')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{userData.fullName || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{userData.username}</p>
                <Button type="button" variant="outline" size="sm" className="mt-2">
                  Thay đổi ảnh đại diện
                </Button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName">Tên đầy đủ</Label>
                <Input
                  id="fullName"
                  value={userData.fullName}
                  onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                  placeholder="Nhập tên đầy đủ"
                  required
                />
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userData.username}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Username không thể thay đổi
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            {/* Success Message */}
            {saved && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Đã lưu thông tin thành công!
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline">
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

