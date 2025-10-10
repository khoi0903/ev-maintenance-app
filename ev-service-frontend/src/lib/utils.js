import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge lớp Tailwind an toàn, cho phép truyền conditionals */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
