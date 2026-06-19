import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';

import {usePriceFeed} from '@/shared/api/websocket';
import {useUIStore} from '@/shared/store';

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({children}: {children: ReactNode}) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('usePriceFeed', () => {
  beforeEach(() => {
    mockReadyState.value = 1;
    useUIStore.setState({
      selectedTicker: null,
      chartTimeframe: '1D',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns connection status when open', () => {
    mockReadyState.value = 1;
    const {result} = renderHook(() => usePriceFeed(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('returns disconnected status when closed', () => {
    mockReadyState.value = 3;
    const {result} = renderHook(() => usePriceFeed(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('returns readyState value', () => {
    mockReadyState.value = 1;
    const {result} = renderHook(() => usePriceFeed(), {
      wrapper: createWrapper(),
    });

    expect(result.current.readyState).toBe(1);
  });

  it('returns CONNECTING status correctly', () => {
    mockReadyState.value = 0;
    const {result} = renderHook(() => usePriceFeed(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.readyState).toBe(0);
  });
});
