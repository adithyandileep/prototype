import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes intelligently using clsx + tailwind-merge.
 * Use this helper as `cn("base classes", condition && "conditional classes")`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
