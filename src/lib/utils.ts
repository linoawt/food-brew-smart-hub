import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency utility functions for Nigerian Naira
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatNairaWithDecimals(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Input sanitization for Nigerian phone numbers
export function sanitizeNigerianPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Handle different Nigerian phone number formats
  if (cleaned.startsWith('234')) {
    return '+' + cleaned
  } else if (cleaned.startsWith('0')) {
    return '+234' + cleaned.slice(1)
  } else if (cleaned.length === 10) {
    return '+234' + cleaned
  }
  
  return '+234' + cleaned
}

// Validate Nigerian phone number
export function isValidNigerianPhone(phone: string): boolean {
  const sanitized = sanitizeNigerianPhone(phone)
  // Nigerian phone numbers should be +234 followed by 10 digits
  return /^\+234[0-9]{10}$/.test(sanitized)
}
