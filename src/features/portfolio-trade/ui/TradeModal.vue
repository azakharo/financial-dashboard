<script setup lang="ts">
import {computed} from 'vue';

import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/shared/ui';
import {useStocks} from '@/entities/stock';
import {useUIStore, storeToRefs} from '@/shared/store';

import TradeForm from './TradeForm.vue';

const uiStore = useUIStore();
const {tradeModalOpen, tradeModalTicker, tradeModalMode} = storeToRefs(uiStore);

const {data: stocksData} = useStocks();

const stocks = computed(() => {
  if (!stocksData.value) return undefined;
  return stocksData.value.pages.flatMap(page => page.stocks);
});

const selectedStock = computed(() =>
  stocks.value?.find(s => s.ticker === tradeModalTicker.value),
);

const title = computed(() =>
  tradeModalMode.value === 'buy' ? 'Покупка акций' : 'Продажа акций',
);

function handleOpenChange(open: boolean) {
  if (!open) {
    uiStore.closeTradeModal();
  }
}
</script>

<template>
  <Dialog :open="tradeModalOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>
      <TradeForm :stock="selectedStock" :mode="tradeModalMode" />
    </DialogContent>
  </Dialog>
</template>
