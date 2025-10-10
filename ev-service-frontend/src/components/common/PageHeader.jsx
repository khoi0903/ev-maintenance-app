import React from "react";
import { Badge } from "@/components/ui/badge";

export default function PageHeader({ title, meta }) {
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{title}</h2>
                {meta && <Badge variant="secondary">{meta}</Badge>}
            </div>
        </div>
    );
}
