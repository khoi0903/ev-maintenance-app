'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Label from '@/components/form/Label'

/**
 * Support Page - Trang hỗ trợ và liên hệ
 */
export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitted(false)

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setSubmitted(true)
      setFormData({
        subject: '',
        category: 'technical',
        message: '',
        email: '',
      })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('Error submitting support request:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground mt-2">
          Liên hệ với chúng tôi để được hỗ trợ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
              <CardDescription>Liên hệ với chúng tôi qua các kênh sau</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Email hỗ trợ</h4>
                <p className="text-sm text-muted-foreground">
                  support@evmaintenance.com
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Hotline</h4>
                <p className="text-sm text-muted-foreground">
                  1900 1234 (24/7)
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Giờ làm việc</h4>
                <p className="text-sm text-muted-foreground">
                  Thứ 2 - Thứ 6: 8:00 - 17:00<br />
                  Thứ 7: 8:00 - 12:00
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Câu hỏi thường gặp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold">Làm thế nào để đổi mật khẩu?</h4>
                  <p className="text-muted-foreground mt-1">
                    Vào Account Settings → Đổi mật khẩu
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Làm thế nào để thêm user mới?</h4>
                  <p className="text-muted-foreground mt-1">
                    Vào Users → Quản lý người dùng → Thêm mới
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Tôi quên mật khẩu?</h4>
                  <p className="text-muted-foreground mt-1">
                    Vào trang đăng nhập → Quên mật khẩu
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Gửi yêu cầu hỗ trợ</CardTitle>
              <CardDescription>
                Điền form bên dưới và chúng tôi sẽ phản hồi trong vòng 24 giờ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitted && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Yêu cầu hỗ trợ đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email của bạn</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="technical">Hỗ trợ kỹ thuật</option>
                    <option value="billing">Thanh toán</option>
                    <option value="account">Tài khoản</option>
                    <option value="feature">Tính năng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Tiêu đề</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Nhập tiêu đề yêu cầu"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Nội dung</Label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Mô tả chi tiết vấn đề của bạn..."
                    rows={6}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

