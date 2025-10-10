import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell } from "lucide-react";

export default function RemindersPage() {
    const [prefs, setPrefs] = useState({ email: true, inapp: true, sms: false });

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid gap-6">
                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Reminders</CardTitle>
                        <CardDescription>Lọc nhanh theo loại</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 rounded-2xl mb-4">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="km">By km</TabsTrigger>
                                <TabsTrigger value="date">By date</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all">
                                <div className="text-center text-sm text-muted-foreground border rounded-xl p-6">
                                    Chưa có nhắc bảo dưỡng
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6">
                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Channels</CardTitle></CardHeader>
                    <CardContent className="grid gap-3">
                        {[
                            { k: "email", label: "Email", sub: "Gửi 9–11h" },
                            { k: "inapp", label: "In-app", sub: "Chuông trong app" },
                            { k: "sms", label: "SMS", sub: "Chỉ khi khẩn cấp" },
                        ].map(x => (
                            <div key={x.k} className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{x.label}</div>
                                    <div className="text-xs text-muted-foreground">{x.sub}</div>
                                </div>
                                <Switch checked={prefs[x.k]} onCheckedChange={(v) => setPrefs(p => ({ ...p, [x.k]: !!v }))} />
                            </div>
                        ))}
                        <Button variant="outline">Gửi test notification</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
