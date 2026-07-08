import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable pseudo-rating from product id (4.2–4.9) for display when API has no reviews. */
export function productRating(id: string): { score: number; count: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const score = 4.2 + (Math.abs(hash) % 8) / 10;
  const count = 12 + (Math.abs(hash) % 180);
  return { score: Math.round(score * 10) / 10, count };
}
