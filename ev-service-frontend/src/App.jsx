
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import WorkOrderStatusPage from "@/pages/WorkOrderStatusPage.jsx";
import PaymentPage from "@/pages/PaymentPage.jsx";
import RemindersPage from "@/pages/RemindersPage.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/work-order" replace />} />
        <Route path="/work-order" element={<WorkOrderStatusPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        {/* 404 */}
        <Route path="*" element={<Navigate to="/work-order" replace />} />
      </Routes>
    </AppShell>
  );
}
