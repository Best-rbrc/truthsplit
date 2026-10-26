import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind + conditional classes consistently
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
