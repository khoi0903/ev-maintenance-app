import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, LayoutDashboard, Wrench, CreditCard, AlarmClock } from "lucide-react";

export default function AppShell({ children }) {
    return (
        <div className="min-h-screen app-bg">
            {/* Header */}
            <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
                <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
                  
                  
                </div>
            </header>

            {/* Body */}
            <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
                {/* Sidebar */}
                <aside className="hidden md:block">
                    <nav className="rounded-2xl border bg-card p-2">
                        {[
                            { to: "/work-order", label: "Work Order", icon: <Wrench className="h-4 w-4" /> },
                            { to: "/payment", label: "Payment", icon: <CreditCard className="h-4 w-4" /> },
                            { to: "/reminders", label: "Reminders", icon: <AlarmClock className="h-4 w-4" /> },
                        ].map((it) => (
                            <NavLink
                                key={it.to}
                                to={it.to}
                                className={({ isActive }) =>
                                    `px-2 py-1.5 rounded-xl flex items-center gap-2 text-sm
                   hover:bg-muted ${isActive ? "bg-muted font-medium" : ""}`
                                }
                            >
                                {it.icon} <span>{it.label}</span>
                            </NavLink>
                        ))}
                        <Separator className="my-2" />
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">v1.0</div>
                    </nav>
                </aside>

                {/* Main content renders route children */}
                <main>{children}</main>
            </div>
        </div>
    );
}
