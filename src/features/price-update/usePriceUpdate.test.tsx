import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {renderHook} from '@testing-library/react';

import {usePriceUpdate} from '@/features/price-update';
import {useUIStore} from '@/shared/store';
import {createWrapper} from '@/tests/utils';

const mockReadyState = {value: 1};

vi.mock('react-use-websocket', () => ({
  default: vi.fn(() => ({
    sendJsonMessage: vi.fn(),
    lastMessage: null,
    readyState: mockReadyState.value,
  })),
  ReadyState: {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  },
}));

describe('usePriceUpdate', () => {
  beforeEach(() => {
    mockReadyState.value = 1;
    useUIStore.setState({
      selectedTicker: null,
      chartTimeframe: '1D',
      sectorFilter: null,
      searchQuery: '',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns connection status when open', () => {
    mockReadyState.value = 1;
    const {result} = renderHook(() => usePriceUpdate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('returns disconnected status when closed', () => {
    mockReadyState.value = 3;
    const {result} = renderHook(() => usePriceUpdate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('returns readyState value', () => {
    mockReadyState.value = 1;
    const {result} = renderHook(() => usePriceUpdate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.readyState).toBe(1);
  });

  it('returns CONNECTING status correctly', () => {
    mockReadyState.value = 0;
    const {result} = renderHook(() => usePriceUpdate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.readyState).toBe(0);
  });
});
