'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { http } from '@/lib/api'

type MeResponse = {
  success: boolean
  data: {
    AccountID: number
    Username: string
    FullName: string | null
    Email: string | null
    Phone: string | null
    Role: 'Admin' | 'Staff' | 'Technician' | 'Customer'
    avatar?: string | null
  }
}

type UpdateMeBody = {
  fullName?: string
  email?: string | null
  phone?: string | null
}

export default function UserProfilePage() {
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    avatar: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        setLoading(true)
        const res = await http.get<MeResponse>('/account/me')
        if (!res?.success || !res?.data) throw new Error('Invalid response')

        const me = res.data
        if (!mounted) return
        setUserData({
          fullName: me.FullName || '',
          username: me.Username || '',
          email: me.Email || '',
          phone: me.Phone || '',
          avatar: me.avatar || '',
        })

        // Đồng bộ storage để header hiển thị tên
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage
        const existed = storage.getItem('user')
        const payload = {
          FullName: me.FullName,
          Email: me.Email,
          Phone: me.Phone,
          Username: me.Username,
          Role: me.Role,
          avatar: me.avatar || null,
        }
        if (existed) {
          const u = JSON.parse(existed)
          storage.setItem('user', JSON.stringify({ ...u, ...payload }))
        } else {
          storage.setItem('user', JSON.stringify(payload))
        }
      } catch (e: any) {
        // Nếu 401, http đã redirect; ở đây chỉ cần setError để không trắng trang
        setError(e?.message || 'Không thể tải hồ sơ.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const body: UpdateMeBody = {
        fullName: userData.fullName,
        email: userData.email || null,
        phone: userData.phone || null,
      }
      const res = await http.put<MeResponse>('/account/me', body)
      if (!res?.success) throw new Error('Update failed')

      const storage = localStorage.getItem('user') ? localStorage : sessionStorage
      const userStr = storage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        storage.setItem('user', JSON.stringify({
          ...user,
          FullName: userData.fullName,
          Email: userData.email,
          Phone: userData.phone,
        }));
         window.dispatchEvent(new Event('user:updated'));
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi cập nhật hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground mt-2">Chỉnh sửa thông tin cá nhân của bạn</p>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10">
          <CardContent className="pt-4">
            <div className="text-red-600 dark:text-red-400 text-sm">
              <div className="font-semibold mb-1">Không thể tải/lưu hồ sơ</div>
              <div>{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải hồ sơ...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userData.avatar} alt={userData.fullName} />
                  <AvatarFallback className="text-2xl bg-green-600 text-white">
                    {getInitials(userData.fullName || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{userData.fullName || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{userData.username}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" disabled>
                    Thay đổi ảnh đại diện
                  </Button>
                </div>
              </div>

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
                  <Input id="username" value={userData.username} disabled className="bg-gray-50 dark:bg-gray-800" />
                  <p className="text-xs text-muted-foreground mt-1">Username không thể thay đổi</p>
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

              {saved && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                  <p className="text-sm text-green-600 dark:text-green-400">✓ Đã lưu thông tin thành công!</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" disabled={saving}>Hủy</Button>
                <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
