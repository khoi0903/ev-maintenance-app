import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StatCard({ label, value, hint }) {
    return (
        <Card className="rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
                {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
            </CardContent>
        </Card>
    );
}
