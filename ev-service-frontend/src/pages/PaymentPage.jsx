import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreditCard } from "lucide-react";

export default function PaymentPage() {
    return (
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid gap-6">
                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Invoice Summary</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground text-sm">Chưa có dữ liệu hóa đơn</div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
                    <CardContent className="max-w-xl">
                        <Tabs defaultValue="card" className="w-full">
                            <TabsList className="w-full grid grid-cols-3 rounded-2xl mb-4">
                                <TabsTrigger value="card">Thẻ</TabsTrigger>
                                <TabsTrigger value="bank">Chuyển khoản</TabsTrigger>
                                <TabsTrigger value="ewallet">Ví</TabsTrigger>
                            </TabsList>

                            <TabsContent value="card" className="grid gap-3">
                                <Label>Tên trên thẻ</Label><Input placeholder="NGUYEN AN" />
                                <Label>Số thẻ</Label><Input placeholder="4111 1111 1111 1111" />
                            </TabsContent>

                            <TabsContent value="bank" className="text-sm">
                                VCBank • STK: <b>________</b> • Nội dung: <b>________</b>
                            </TabsContent>

                            <TabsContent value="ewallet" className="grid gap-2">
                                <div className="text-sm text-muted-foreground">Quét mã QR để thanh toán.</div>
                                <Button variant="outline">Hiển thị QR</Button>
                            </TabsContent>
                        </Tabs>

                        <Button className="w-full mt-4 flex items-center justify-center gap-2">
                            <CreditCard className="h-4 w-4" /> Xác nhận thanh toán
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6">
                <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Dữ liệu được mã hóa. Không lưu thông tin thẻ.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
