import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/vue';
import {afterEach, afterAll, beforeAll, vi} from 'vitest';
import {server} from './server';

beforeAll(() => server.listen({onUnhandledRequest: 'error'}));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

const mockWebSocketInstance = vi.fn(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
}));

const MockWebSocket = Object.assign(mockWebSocketInstance, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
});

vi.stubGlobal('WebSocket', MockWebSocket);
