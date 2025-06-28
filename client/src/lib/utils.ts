import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'PDF Belgesi';
    case 'jpg':
    case 'jpeg':
      return 'JPEG Resmi';
    case 'png':
      return 'PNG Resmi';
    default:
      return 'Dosya';
  }
}

export function isValidPhoneNumber(phone: string): boolean {
  // Basic Turkish phone number validation
  const phoneRegex = /^(\+90|90)?[\s]?[(]?[\d]{3}[)]?[\s]?[\d]{3}[\s]?[\d]{2}[\s]?[\d]{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 90, add +
  if (cleaned.startsWith('90') && !cleaned.startsWith('+90')) {
    return '+' + cleaned;
  }
  
  // If it doesn't start with + or country code, assume Turkish
  if (!cleaned.startsWith('+') && !cleaned.startsWith('90')) {
    return '+90' + cleaned;
  }
  
  return cleaned;
}
