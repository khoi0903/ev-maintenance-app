import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Wrench, ShoppingCart, Timer, User2 } from "lucide-react";
import StatCard from "@/components/common/StatCard";

export default function WorkOrderStatusPage() {
    return (
        <div className="grid gap-6">
            {/* top stats */}
            <div className="grid sm:grid-cols-3 gap-3">
                <StatCard label="Status" value={<Badge>--</Badge>} hint="ETA: --" />
                <StatCard label="Vehicle" value="--" hint="VIN --" />
                <StatCard label="Odo" value="-- km" hint="Last service: --" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* left */}
                <div className="lg:col-span-2 grid gap-6">
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-base">Tiến trình • Progress</CardTitle>
                            <CardDescription>intake → diagnosis → repair → QA → done</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={0} className="mb-4" />
                            <div className="flex flex-wrap gap-2 text-xs">
                                {["intake", "diagnosis", "repair", "qa", "ready_for_pickup", "closed"].map((k) => (
                                    <Badge key={k} variant="outline">{k}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="rounded-xl border p-3">
                                <div className="font-medium flex items-center gap-2"><Wrench className="h-4 w-4" /> Vehicle</div>
                            </div>
                            <div className="rounded-xl border p-3">
                                <div className="font-medium flex items-center gap-2"><User2 className="h-4 w-4" /> Customer</div>
                            </div>
                            <div className="rounded-xl border p-3">
                                <div className="font-medium flex items-center gap-2"><Timer className="h-4 w-4" /> Technician</div>
                                <Dialog>
                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="mt-2">Phân công KTV</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Assign Technician</DialogTitle>
                                            <DialogDescription>Chọn KTV và khung giờ</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-2">
                                            <Label>Kỹ thuật viên</Label>
                                            <Select>
                                                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="a">KTV A</SelectItem>
                                                    <SelectItem value="b">KTV B</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Label>Bắt đầu</Label>
                                            <Input type="datetime-local" />
                                            <Button className="mt-2">Xác nhận</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="parts">
                        <TabsList className="grid grid-cols-5 w-full rounded-2xl">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="checklist">Checklist</TabsTrigger>
                            <TabsTrigger value="parts">Parts/Services</TabsTrigger>
                            <TabsTrigger value="billing">Billing</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="mt-4">
                            <Card className="rounded-2xl">
                                <CardHeader><CardTitle className="text-base">Chẩn đoán</CardTitle></CardHeader>
                                <CardContent>
                                    <Textarea placeholder="Nhập chẩn đoán..." />
                                    <div className="mt-3 flex gap-2">
                                        <Button variant="outline">Lưu</Button>
                                        <Button>Đẩy sang QA</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="checklist" className="mt-4 space-y-3">
                            {["Battery", "Brake", "Tire", "Cooling"].map((item, idx) => (
                                <label key={idx} className="flex items-center gap-3 rounded-xl border p-3">
                                    <Checkbox />
                                    <div className="flex-1">
                                        <div className="font-medium">{item}</div>
                                        <div className="text-xs text-muted-foreground">Ghi chú</div>
                                    </div>
                                    <Input placeholder="Note" className="max-w-[220px]" />
                                </label>
                            ))}
                            <Button>Lưu checklist</Button>
                        </TabsContent>

                        <TabsContent value="parts" className="mt-4">
                            <Card className="rounded-2xl">
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Chi tiết</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* right sticky summary */}
                <div className="grid gap-6">
                    <Card className="rounded-2xl sticky top-20">
                        <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button variant="outline">Gửi cập nhật</Button>
                            <Button variant="outline">Gọi khách</Button>
                            <Button>Chuyển sang thanh toán</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
