import {describe, expect, it, beforeEach, afterEach, vi} from 'vitest';

import {useUIStore} from '@/shared/store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedTicker: null,
      tradeModalOpen: false,
      tradeModalTicker: null,
      tradeModalMode: 'buy',
      sectorFilter: null,
      searchQuery: '',
      chartTimeframe: '1D',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setSelectedTicker', () => {
    it('sets selected ticker', () => {
      useUIStore.getState().setSelectedTicker('AAPL');
      expect(useUIStore.getState().selectedTicker).toBe('AAPL');
    });

    it('clears selected ticker when null', () => {
      useUIStore.getState().setSelectedTicker('AAPL');
      useUIStore.getState().setSelectedTicker(null);
      expect(useUIStore.getState().selectedTicker).toBeNull();
    });
  });

  describe('openTradeModal', () => {
    it('opens modal with correct ticker and buy mode', () => {
      useUIStore.getState().openTradeModal('GOOGL', 'buy');
      const state = useUIStore.getState();
      expect(state.tradeModalOpen).toBe(true);
      expect(state.tradeModalTicker).toBe('GOOGL');
      expect(state.tradeModalMode).toBe('buy');
    });

    it('opens modal with sell mode', () => {
      useUIStore.getState().openTradeModal('MSFT', 'sell');
      const state = useUIStore.getState();
      expect(state.tradeModalOpen).toBe(true);
      expect(state.tradeModalTicker).toBe('MSFT');
      expect(state.tradeModalMode).toBe('sell');
    });
  });

  describe('closeTradeModal', () => {
    it('closes modal and clears ticker', () => {
      useUIStore.getState().openTradeModal('AAPL', 'buy');
      useUIStore.getState().closeTradeModal();
      const state = useUIStore.getState();
      expect(state.tradeModalOpen).toBe(false);
      expect(state.tradeModalTicker).toBeNull();
    });

    it('preserves mode after closing', () => {
      useUIStore.getState().openTradeModal('AAPL', 'sell');
      useUIStore.getState().closeTradeModal();
      expect(useUIStore.getState().tradeModalMode).toBe('sell');
    });
  });

  describe('setSectorFilter', () => {
    it('sets sector filter', () => {
      useUIStore.getState().setSectorFilter('Technology');
      expect(useUIStore.getState().sectorFilter).toBe('Technology');
    });

    it('clears sector filter when null', () => {
      useUIStore.getState().setSectorFilter('Finance');
      useUIStore.getState().setSectorFilter(null);
      expect(useUIStore.getState().sectorFilter).toBeNull();
    });
  });

  describe('setSearchQuery', () => {
    it('sets search query', () => {
      useUIStore.getState().setSearchQuery('Apple');
      expect(useUIStore.getState().searchQuery).toBe('Apple');
    });

    it('handles empty string', () => {
      useUIStore.getState().setSearchQuery('Test');
      useUIStore.getState().setSearchQuery('');
      expect(useUIStore.getState().searchQuery).toBe('');
    });
  });

  describe('setChartTimeframe', () => {
    it('sets 1D timeframe', () => {
      useUIStore.getState().setChartTimeframe('1D');
      expect(useUIStore.getState().chartTimeframe).toBe('1D');
    });

    it('sets 1W timeframe', () => {
      useUIStore.getState().setChartTimeframe('1W');
      expect(useUIStore.getState().chartTimeframe).toBe('1W');
    });

    it('sets 1M timeframe', () => {
      useUIStore.getState().setChartTimeframe('1M');
      expect(useUIStore.getState().chartTimeframe).toBe('1M');
    });

    it('sets 1Y timeframe', () => {
      useUIStore.getState().setChartTimeframe('1Y');
      expect(useUIStore.getState().chartTimeframe).toBe('1Y');
    });
  });

  describe('multiple actions', () => {
    it('handles sequential state changes', () => {
      useUIStore.getState().setSelectedTicker('AAPL');
      useUIStore.getState().setSectorFilter('Technology');
      useUIStore.getState().setSearchQuery('App');
      useUIStore.getState().setChartTimeframe('1W');

      const state = useUIStore.getState();
      expect(state.selectedTicker).toBe('AAPL');
      expect(state.sectorFilter).toBe('Technology');
      expect(state.searchQuery).toBe('App');
      expect(state.chartTimeframe).toBe('1W');
    });

    it('isolates modal state from other state', () => {
      useUIStore.getState().setSelectedTicker('GOOGL');
      useUIStore.getState().openTradeModal('AAPL', 'buy');

      const state = useUIStore.getState();
      expect(state.selectedTicker).toBe('GOOGL');
      expect(state.tradeModalTicker).toBe('AAPL');
    });
  });
});
