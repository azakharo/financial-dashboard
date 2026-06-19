import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';

import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelative,
  parseDate,
} from '@/shared/lib/date';

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-03-15T10:30:00Z');
    expect(formatDate(date)).toMatch(/15.*мар.*2024/);
  });

  it('formats ISO string correctly', () => {
    expect(formatDate('2024-06-20')).toMatch(/20.*июн.*2024/);
  });

  it('handles different years', () => {
    expect(formatDate('2020-01-01')).toMatch(/1.*янв.*2020/);
  });
});

describe('formatTime', () => {
  it('formats time correctly', () => {
    const date = new Date('2024-03-15T14:30:45');
    expect(formatTime(date)).toBe('14:30:45');
  });

  it('formats time from ISO string', () => {
    expect(formatTime('2024-03-15T09:05:03')).toBe('09:05:03');
  });

  it('pads single digits with zeros', () => {
    expect(formatTime('2024-03-15T01:02:03')).toBe('01:02:03');
  });
});

describe('formatDateTime', () => {
  it('formats date and time together', () => {
    const result = formatDateTime('2024-03-15T14:30:00');
    expect(result).toMatch(/15.*мар.*2024/);
    expect(result).toContain('14:30');
  });

  it('formats Date object', () => {
    const date = new Date('2024-03-15T14:30:00');
    const result = formatDateTime(date);
    expect(result).toMatch(/15.*мар.*2024/);
    expect(result).toContain('14:30');
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows recent time correctly', () => {
    const recent = new Date('2024-03-15T11:59:30');
    const result = formatRelative(recent);
    expect(result).toContain('минут');
    expect(result).toContain('назад');
  });

  it('shows minutes ago', () => {
    const fiveMinAgo = new Date('2024-03-15T11:55:00');
    const result = formatRelative(fiveMinAgo);
    expect(result).toContain('5');
    expect(result).toContain('минут');
  });

  it('shows hours ago', () => {
    const twoHoursAgo = new Date('2024-03-15T10:00:00');
    const result = formatRelative(twoHoursAgo);
    expect(result).toContain('2');
    expect(result).toContain('час');
  });

  it('works with ISO string', () => {
    const oneHourAgo = '2024-03-15T11:00:00';
    const result = formatRelative(oneHourAgo);
    expect(result).toContain('1');
    expect(result).toContain('час');
  });
});

describe('parseDate', () => {
  it('parses ISO string to Date', () => {
    const result = parseDate('2024-03-15T10:30:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-03-15T10:30:00.000Z');
  });

  it('parses date only string', () => {
    const result = parseDate('2024-06-20');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(20);
  });
});
