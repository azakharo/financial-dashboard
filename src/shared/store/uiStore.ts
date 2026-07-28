import {ref} from 'vue';
import {defineStore, storeToRefs} from 'pinia';

import type {Sector, Timeframe} from '@/shared/api/types';

export type TradeMode = 'buy' | 'sell';

export const useUIStore = defineStore('ui', () => {
  const selectedTicker = ref<string | null>(null);
  const tradeModalOpen = ref(false);
  const tradeModalTicker = ref<string | null>(null);
  const tradeModalMode = ref<TradeMode>('buy');
  const sectorFilter = ref<Sector | null>(null);
  const searchQuery = ref('');
  const chartTimeframe = ref<Timeframe>('1D');

  function setSelectedTicker(ticker: string | null) {
    selectedTicker.value = ticker;
  }

  function openTradeModal(ticker: string, mode: TradeMode) {
    tradeModalOpen.value = true;
    tradeModalTicker.value = ticker;
    tradeModalMode.value = mode;
  }

  function closeTradeModal() {
    tradeModalOpen.value = false;
    tradeModalTicker.value = null;
  }

  function setSectorFilter(sector: Sector | null) {
    sectorFilter.value = sector;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setChartTimeframe(timeframe: Timeframe) {
    chartTimeframe.value = timeframe;
  }

  function $reset() {
    selectedTicker.value = null;
    tradeModalOpen.value = false;
    tradeModalTicker.value = null;
    tradeModalMode.value = 'buy';
    sectorFilter.value = null;
    searchQuery.value = '';
    chartTimeframe.value = '1D';
  }

  return {
    selectedTicker,
    tradeModalOpen,
    tradeModalTicker,
    tradeModalMode,
    sectorFilter,
    searchQuery,
    chartTimeframe,
    setSelectedTicker,
    openTradeModal,
    closeTradeModal,
    setSectorFilter,
    setSearchQuery,
    setChartTimeframe,
    $reset,
  };
});

export {storeToRefs};
