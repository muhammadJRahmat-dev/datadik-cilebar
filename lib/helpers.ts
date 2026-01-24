// Utility functions for Datadik Cilebar

/**
 * Format numbers with Indonesian locale
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format date with Indonesian locale
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateObj);
    case 'long':
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
    case 'full':
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
    default:
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
  }
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get school type badge color
 */
export function getSchoolTypeColor(type: string): string {
  const colors: Record<string, string> = {
    TK: 'bg-purple-100 text-purple-700',
    KB: 'bg-pink-100 text-pink-700',
    SPS: 'bg-pink-100 text-pink-700',
    SD: 'bg-blue-100 text-blue-700',
    SMP: 'bg-green-100 text-green-700',
    SMA: 'bg-amber-100 text-amber-700',
    SMK: 'bg-orange-100 text-orange-700',
  };
  return colors[type] || 'bg-slate-100 text-slate-700';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate random password
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number (Indonesia format)
 */
export function isValidPhone(phone: string): boolean {
  const re = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return re.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...params: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...params), wait);
  }) as T;

  return debounced;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
