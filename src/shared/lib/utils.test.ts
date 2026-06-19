import {describe, expect, it} from 'vitest';

import {cn} from '@/shared/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    const isVisible = true;
    const isHidden = false;
    expect(cn('text-sm', isVisible && 'font-bold', isHidden && 'hidden')).toBe(
      'text-sm font-bold',
    );
  });

  it('handles undefined and null', () => {
    expect(cn('bg-white', undefined, null, 'text-black')).toBe(
      'bg-white text-black',
    );
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles object syntax', () => {
    expect(cn({visible: true, hidden: false})).toBe('visible');
  });

  it('handles array syntax', () => {
    expect(cn(['flex', 'items-center'])).toBe('flex items-center');
  });

  it('handles complex combinations', () => {
    expect(cn('px-2 py-1', 'px-4', {rounded: true})).toBe('py-1 px-4 rounded');
  });
});
