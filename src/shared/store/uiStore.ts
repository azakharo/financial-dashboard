import {create} from 'zustand';

import type {Sector, Timeframe} from '@/shared/api/types';

export type TradeMode = 'buy' | 'sell';

interface UIState {
  selectedTicker: string | null;
  tradeModalOpen: boolean;
  tradeModalTicker: string | null;
  tradeModalMode: TradeMode;
  sectorFilter: Sector | null;
  searchQuery: string;
  chartTimeframe: Timeframe;
}

interface UIActions {
  setSelectedTicker: (ticker: string | null) => void;
  openTradeModal: (ticker: string, mode: TradeMode) => void;
  closeTradeModal: () => void;
  setSectorFilter: (sector: Sector | null) => void;
  setSearchQuery: (query: string) => void;
  setChartTimeframe: (timeframe: Timeframe) => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>(set => ({
  selectedTicker: null,
  tradeModalOpen: false,
  tradeModalTicker: null,
  tradeModalMode: 'buy',
  sectorFilter: null,
  searchQuery: '',
  chartTimeframe: '1D',

  setSelectedTicker: ticker => set({selectedTicker: ticker}),
  openTradeModal: (ticker, mode) =>
    set({
      tradeModalOpen: true,
      tradeModalTicker: ticker,
      tradeModalMode: mode,
    }),
  closeTradeModal: () =>
    set({
      tradeModalOpen: false,
      tradeModalTicker: null,
    }),
  setSectorFilter: sector => set({sectorFilter: sector}),
  setSearchQuery: query => set({searchQuery: query}),
  setChartTimeframe: timeframe => set({chartTimeframe: timeframe}),
}));
