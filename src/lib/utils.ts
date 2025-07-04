import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Determines if a given hex color is dark.
 * @param hexColor - The color in hex format (e.g., "#RRGGBB").
 * @returns True if the color is dark, false otherwise.
 */
export function isColorDark(hexColor: string): boolean {
  if (!hexColor || hexColor.length < 4) {
    // Return a default for invalid or short hex codes
    return false;
  }
  
  // Convert hex to RGB
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}
