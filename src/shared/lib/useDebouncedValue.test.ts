import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';

import {useDebouncedValue} from '@/shared/lib/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const {result} = renderHook(() => useDebouncedValue('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', async () => {
    const {result, rerender} = renderHook(
      ({value, delay}) => useDebouncedValue(value, delay),
      {initialProps: {value: 'first', delay: 500}},
    );

    expect(result.current).toBe('first');

    rerender({value: 'second', delay: 500});
    expect(result.current).toBe('first');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(result.current).toBe('first');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    expect(result.current).toBe('second');
  });

  it('cancels pending update on new value', async () => {
    const {result, rerender} = renderHook(
      ({value, delay}) => useDebouncedValue(value, delay),
      {initialProps: {value: 'a', delay: 500}},
    );

    rerender({value: 'b', delay: 500});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    rerender({value: 'c', delay: 500});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current).toBe('c');
  });

  it('handles zero delay', async () => {
    const {result, rerender} = renderHook(
      ({value, delay}) => useDebouncedValue(value, delay),
      {initialProps: {value: 'initial', delay: 0}},
    );

    rerender({value: 'updated', delay: 0});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current).toBe('updated');
  });

  it('handles numeric values', async () => {
    const {result, rerender} = renderHook(
      ({value, delay}) => useDebouncedValue(value, delay),
      {initialProps: {value: 0, delay: 300}},
    );

    rerender({value: 42, delay: 300});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current).toBe(42);
  });

  it('handles object values', async () => {
    type TestObj = {a?: number; b?: number};
    const initial: TestObj = {a: 1};
    const updated: TestObj = {b: 2};

    const {result, rerender} = renderHook(
      ({value, delay}) => useDebouncedValue<TestObj>(value, delay),
      {initialProps: {value: initial, delay: 300}},
    );

    rerender({value: updated, delay: 300});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current).toBe(updated);
  });

  it('cleans up on unmount', async () => {
    const {unmount, rerender} = renderHook(
      ({value, delay}) => useDebouncedValue(value, delay),
      {initialProps: {value: 'test', delay: 500}},
    );

    rerender({value: 'changed', delay: 500});
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
  });
});
