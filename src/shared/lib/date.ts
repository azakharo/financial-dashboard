import {format, formatDistanceToNow, parseISO} from 'date-fns';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm:ss');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy HH:mm');
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, {addSuffix: true});
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}
