import {setDefaultOptions} from 'date-fns';
import {ru} from 'date-fns/locale';

setDefaultOptions({locale: ru});

import {format, formatDistanceToNow, parseISO} from 'date-fns';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM yyyy');
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm:ss');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'd MMM yyyy HH:mm');
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, {addSuffix: true});
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}
