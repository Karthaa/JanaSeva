import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a stable anonymous device ID for privacy-preserving ticket submission.
 * Stored in localStorage so the same device reuses one UUID.
 */
export function getDeviceId(): string {
  const KEY = 'jalsaaf_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Generate a human-readable ticket number: JS-YYYYMMDD-XXXX
 */
export function generateTicketNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `JS-${date}-${rand}`;
}
