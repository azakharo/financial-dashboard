<script setup lang="ts">
import {computed} from 'vue';

import {Card, CardContent, CardHeader, CardTitle, Badge} from '@/shared/ui';
import {useStocks} from '@/entities/stock';
import {useUIStore, storeToRefs} from '@/shared/store';
import {SearchInput} from '@/features/search';
import {SECTORS} from '@/shared/api';

import StockTableBody from './StockTableBody.vue';

const uiStore = useUIStore();
const {selectedTicker, sectorFilter, searchQuery} = storeToRefs(uiStore);

const {data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage} =
  useStocks({
    sector: sectorFilter,
    search: searchQuery,
  });

const stocks = computed(() => {
  if (!data.value) return [];
  return data.value.pages.flatMap(page => page.stocks);
});

const queryKey = computed(
  () => `${sectorFilter.value ?? 'all'}-${searchQuery.value ?? ''}`,
);

function handleSelect(ticker: string) {
  uiStore.setSelectedTicker(ticker);
}

function handleBuy(ticker: string) {
  uiStore.openTradeModal(ticker, 'buy');
}

function handleSell(ticker: string) {
  uiStore.openTradeModal(ticker, 'sell');
}

function handleSectorClick(sector: string | null) {
  uiStore.setSectorFilter(sector);
}

async function handleLoadMore() {
  await fetchNextPage();
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Акции</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <div class="flex flex-col gap-3">
        <SearchInput />
        <div class="flex flex-wrap gap-2">
          <Badge
            :variant="sectorFilter === null ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="handleSectorClick(null)"
          >
            Все
          </Badge>
          <Badge
            v-for="sector in SECTORS"
            :key="sector"
            :variant="sectorFilter === sector ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="handleSectorClick(sector)"
          >
            {{ sector }}
          </Badge>
        </div>
      </div>
      <div
        class="flex items-center border-b border-gray-200 px-4 py-2 text-sm font-medium text-muted-foreground"
      >
        <div class="min-w-12">Тикер</div>
        <div class="min-w-32">Название</div>
        <div class="w-32 text-right">Цена</div>
        <div class="w-24 text-right">24ч</div>
        <div class="w-24 text-right">В портфеле</div>
        <div class="w-48 text-right">Действия</div>
      </div>
      <StockTableBody
        :stocks="stocks"
        :selected-ticker="selectedTicker"
        :is-loading="isLoading"
        :query-key="queryKey"
        @select="handleSelect"
        @buy="handleBuy"
        @sell="handleSell"
      />
      <button
        v-if="hasNextPage"
        type="button"
        :disabled="isFetchingNextPage"
        class="mt-2 rounded-sm bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        @click="handleLoadMore"
      >
        {{ isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё' }}
      </button>
    </CardContent>
  </Card>
</template>
