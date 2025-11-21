// app/admin/appointments/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/admin.service';
import type { Appointment, Account } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppointmentWithExtras = Appointment & {
  TechnicianName?: string | null;
  ServiceName?: string | null;
  CustomerName?: string | null;
  LicensePlate?: string | null;
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithExtras[]>([]);
  const [technicians, setTechnicians] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<Record<number, number | ''>>({});

  const [statusFilter, setStatusFilter] =
    useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter(appt => {
      if (statusFilter === 'pending') return appt.Status === 'Pending';
      if (statusFilter === 'confirmed') return appt.Status === 'Confirmed';
      if (statusFilter === 'cancelled') return appt.Status === 'Cancelled';
      return true;
    });
  }, [appointments, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [apptRes, techRes] = await Promise.all([
        adminService.getAppointments(),
        adminService.getTechnicians(),
      ]);

      if (!apptRes.success) {
        throw new Error((apptRes as any).message || 'Không thể tải lịch hẹn');
      }
      if (!techRes.success) {
        throw new Error((techRes as any).message || 'Không thể tải danh sách kỹ thuật viên');
      }

      setAppointments(apptRes.data || []);
      setTechnicians(techRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChangeTech = (appointmentId: number, technicianId: string) => {
    setSelectedTech(prev => ({
      ...prev,
      [appointmentId]: technicianId ? Number(technicianId) : '',
    }));
  };

  const handleConfirmWithTech = async (appt: AppointmentWithExtras) => {
    const apptId = appt.AppointmentID;
    const techId = selectedTech[apptId];

    if (!techId) {
      setError('Vui lòng chọn kỹ thuật viên trước');
      return;
    }

    try {
      setRowLoading(prev => ({ ...prev, [apptId]: true }));
      setError(null);

      const res = await adminService.confirmAppointmentWithTechnician({
        appointmentId: apptId,
        technicianId: Number(techId),
      });

      if (!res.success) {
        throw new Error(
          (res as any).message ||
            (res as any).error?.message ||
            'Không thể xác nhận lịch hẹn',
        );
      }

      // cập nhật nhanh trên FE (để khóa hàng + hiện tên tech)
      const techName =
        technicians.find(t => t.AccountID === Number(techId))?.FullName ||
        appt.TechnicianName;

      setAppointments(prev =>
        prev.map(item =>
          item.AppointmentID === apptId
            ? { ...item, Status: 'Confirmed', TechnicianName: techName }
            : item,
        ),
      );

      // sync lại với DB
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi xác nhận lịch hẹn');
    } finally {
      setRowLoading(prev => ({ ...prev, [apptId]: false }));
    }
  };

  const handleCancel = async (apptId: number) => {
    if (!window.confirm('Bạn chắc chắn muốn hủy lịch hẹn này?')) return;

    setRowLoading(prev => ({ ...prev, [apptId]: true }));
    setError(null);
    try {
      const res = await adminService.cancelAppointment(apptId);
      if (!res.success) {
        throw new Error(
          (res as any).message ||
            (res as any).error?.message ||
            'Không thể hủy lịch hẹn',
        );
      }

      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi hủy lịch hẹn');
    } finally {
      setRowLoading(prev => ({ ...prev, [apptId]: false }));
    }
  };

  const formatTimeRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const start = new Date(date.getTime());
    const end = new Date(date.getTime() + 30 * 60 * 1000);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startStr} – ${endStr}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          Quản lý lịch hẹn &amp; phân công kỹ thuật viên
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lịch hẹn <b>Pending</b> có thể chọn kỹ thuật viên và xác nhận. Khi đã xác nhận,
          lịch hẹn sẽ bị khóa và chỉ hiển thị kỹ thuật viên được phân công.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Lọc theo trạng thái:</span>
        <div className="inline-flex rounded-md border bg-white p-1 text-xs">
          <button
            className={cn(
              'px-3 py-1 rounded-md',
              statusFilter === 'all' && 'bg-slate-900 text-white',
            )}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={cn(
              'px-3 py-1 rounded-md',
              statusFilter === 'pending' && 'bg-amber-500 text-white',
            )}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={cn(
              'px-3 py-1 rounded-md',
              statusFilter === 'confirmed' && 'bg-emerald-500 text-white',
            )}
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmed
          </button>
          <button
            className={cn(
              'px-3 py-1 rounded-md',
              statusFilter === 'cancelled' && 'bg-red-500 text-white',
            )}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-white">
          {/* header */}
          <div className="grid grid-cols-[80px,1.4fr,1.2fr,1.5fr] bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
            <div>ID</div>
            <div>Thời gian</div>
            <div>Khách hàng / Xe / Dịch vụ</div>
            <div>Kỹ thuật viên &amp; Thao tác</div>
          </div>

          {filteredAppointments.map(appt => {
            const apptId = appt.AppointmentID;
            const isRowLoading = !!rowLoading[apptId];
            const isConfirmed = appt.Status === 'Confirmed';
            const isCancelled = appt.Status === 'Cancelled';

            const selected = selectedTech[apptId] ?? '';

            // tên tech từ API (nếu có)
            const technicianFromAppt =
              (appt as any).TechnicianName ||
              technicians.find(t => t.AccountID === (appt as any).TechnicianID)?.FullName;

            // tên tech từ state (user vừa chọn)
            const technicianFromState =
              technicians.find(t => t.AccountID === Number(selected))?.FullName;

            const technicianDisplayName = technicianFromAppt || technicianFromState;

            return (
              <div
                key={apptId}
                className={cn(
                  'grid grid-cols-[80px,1.4fr,1.2fr,1.5fr] border-t px-4 py-3 text-sm transition-colors hover:bg-slate-50',
                  isCancelled && 'opacity-60',
                )}
              >
                {/* ID + status */}
                <div className="flex flex-col justify-center text-xs">
                  <span className="font-medium">#{apptId}</span>
                  <span
                    className={cn(
                      'mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                      appt.Status === 'Pending' &&
                        'border border-amber-200 bg-amber-50 text-amber-700',
                      appt.Status === 'Confirmed' &&
                        'border border-emerald-200 bg-emerald-50 text-emerald-700',
                      appt.Status === 'Cancelled' &&
                        'border border-red-200 bg-red-50 text-red-700',
                    )}
                  >
                    {appt.Status}
                  </span>
                </div>

                {/* time */}
                <div className="text-xs">
                  <div className="font-medium">
                    {formatTimeRange(appt.ScheduledDate as any)}
                  </div>
                  <div className="text-muted-foreground">
                    {formatDate(appt.ScheduledDate as any)}
                  </div>
                </div>

                {/* customer / vehicle / service */}
                <div className="space-y-0.5 text-xs">
                  <div className="font-semibold">
                    {(appt as any).CustomerName || 'khách'}
                  </div>
                  <div className="text-muted-foreground">
                    Biển số: {(appt as any).LicensePlate || '—'}
                  </div>
                  <div className="text-muted-foreground">
                    Dịch vụ: {appt.ServiceName || '—'}
                  </div>
                </div>

                {/* technician & actions */}
                <div className="flex items-center justify-between gap-2">
                  {/* left: tech info / select */}
                  <div className="flex-1">
                    {isConfirmed ? (
                      technicianDisplayName ? (
                        <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          {technicianDisplayName}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Đã xác nhận
                        </span>
                      )
                    ) : isCancelled ? (
                      <span className="text-xs text-muted-foreground">
                        Đã hủy
                      </span>
                    ) : (
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
                        value={selected}
                        onChange={e => handleChangeTech(apptId, e.target.value)}
                        disabled={isRowLoading}
                      >
                        <option value="">— Chọn kỹ thuật viên —</option>
                        {technicians.map(t => (
                          <option key={t.AccountID} value={t.AccountID}>
                            {t.FullName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* right: actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="min-w-[150px] justify-center px-3 py-1 text-xs"
                      disabled={
                        isRowLoading ||
                        isCancelled ||
                        isConfirmed ||
                        !selectedTech[apptId]
                      }
                      onClick={() => handleConfirmWithTech(appt)}
                    >
                      {isRowLoading
                        ? 'Đang xử lý...'
                        : isConfirmed
                        ? 'Đã xác nhận'
                        : 'Xác nhận + tạo WO'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 py-1 text-xs"
                      disabled={isRowLoading || isCancelled}
                      onClick={() => handleCancel(apptId)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAppointments.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              Chưa có lịch hẹn nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
