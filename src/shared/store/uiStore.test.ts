import {describe, expect, it, beforeEach, afterEach, vi} from 'vitest';
import {createPinia, setActivePinia} from 'pinia';

import {useUIStore} from '@/shared/store';

describe('useUIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setSelectedTicker', () => {
    it('sets selected ticker', () => {
      const store = useUIStore();
      store.setSelectedTicker('AAPL');
      expect(store.selectedTicker).toBe('AAPL');
    });

    it('clears selected ticker when null', () => {
      const store = useUIStore();
      store.setSelectedTicker('AAPL');
      store.setSelectedTicker(null);
      expect(store.selectedTicker).toBeNull();
    });
  });

  describe('openTradeModal', () => {
    it('opens modal with correct ticker and buy mode', () => {
      const store = useUIStore();
      store.openTradeModal('GOOGL', 'buy');
      expect(store.tradeModalOpen).toBe(true);
      expect(store.tradeModalTicker).toBe('GOOGL');
      expect(store.tradeModalMode).toBe('buy');
    });

    it('opens modal with sell mode', () => {
      const store = useUIStore();
      store.openTradeModal('MSFT', 'sell');
      expect(store.tradeModalOpen).toBe(true);
      expect(store.tradeModalTicker).toBe('MSFT');
      expect(store.tradeModalMode).toBe('sell');
    });
  });

  describe('closeTradeModal', () => {
    it('closes modal and clears ticker', () => {
      const store = useUIStore();
      store.openTradeModal('AAPL', 'buy');
      store.closeTradeModal();
      expect(store.tradeModalOpen).toBe(false);
      expect(store.tradeModalTicker).toBeNull();
    });

    it('preserves mode after closing', () => {
      const store = useUIStore();
      store.openTradeModal('AAPL', 'sell');
      store.closeTradeModal();
      expect(store.tradeModalMode).toBe('sell');
    });
  });

  describe('setSectorFilter', () => {
    it('sets sector filter', () => {
      const store = useUIStore();
      store.setSectorFilter('Technology');
      expect(store.sectorFilter).toBe('Technology');
    });

    it('clears sector filter when null', () => {
      const store = useUIStore();
      store.setSectorFilter('Finance');
      store.setSectorFilter(null);
      expect(store.sectorFilter).toBeNull();
    });
  });

  describe('setSearchQuery', () => {
    it('sets search query', () => {
      const store = useUIStore();
      store.setSearchQuery('Apple');
      expect(store.searchQuery).toBe('Apple');
    });

    it('handles empty string', () => {
      const store = useUIStore();
      store.setSearchQuery('Test');
      store.setSearchQuery('');
      expect(store.searchQuery).toBe('');
    });
  });

  describe('setChartTimeframe', () => {
    it('sets 1D timeframe', () => {
      const store = useUIStore();
      store.setChartTimeframe('1D');
      expect(store.chartTimeframe).toBe('1D');
    });

    it('sets 1W timeframe', () => {
      const store = useUIStore();
      store.setChartTimeframe('1W');
      expect(store.chartTimeframe).toBe('1W');
    });

    it('sets 1M timeframe', () => {
      const store = useUIStore();
      store.setChartTimeframe('1M');
      expect(store.chartTimeframe).toBe('1M');
    });

    it('sets 1Y timeframe', () => {
      const store = useUIStore();
      store.setChartTimeframe('1Y');
      expect(store.chartTimeframe).toBe('1Y');
    });
  });

  describe('multiple actions', () => {
    it('handles sequential state changes', () => {
      const store = useUIStore();
      store.setSelectedTicker('AAPL');
      store.setSectorFilter('Technology');
      store.setSearchQuery('App');
      store.setChartTimeframe('1W');

      expect(store.selectedTicker).toBe('AAPL');
      expect(store.sectorFilter).toBe('Technology');
      expect(store.searchQuery).toBe('App');
      expect(store.chartTimeframe).toBe('1W');
    });

    it('isolates modal state from other state', () => {
      const store = useUIStore();
      store.setSelectedTicker('GOOGL');
      store.openTradeModal('AAPL', 'buy');

      expect(store.selectedTicker).toBe('GOOGL');
      expect(store.tradeModalTicker).toBe('AAPL');
    });
  });

  describe('$reset', () => {
    it('resets all state to initial values', () => {
      const store = useUIStore();
      store.setSelectedTicker('AAPL');
      store.openTradeModal('GOOGL', 'sell');
      store.setSectorFilter('Technology');
      store.setSearchQuery('Test');
      store.setChartTimeframe('1Y');

      store.$reset();

      expect(store.selectedTicker).toBeNull();
      expect(store.tradeModalOpen).toBe(false);
      expect(store.tradeModalTicker).toBeNull();
      expect(store.tradeModalMode).toBe('buy');
      expect(store.sectorFilter).toBeNull();
      expect(store.searchQuery).toBe('');
      expect(store.chartTimeframe).toBe('1D');
    });
  });
});
