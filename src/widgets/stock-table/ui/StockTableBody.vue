<script setup lang="ts">
import {ref, watch, computed} from 'vue';
import {useVirtualizer} from '@tanstack/vue-virtual';

import type {Stock} from '@/shared/api';

const props = defineProps<{
  stocks: Stock[];
  selectedTicker: string | null;
  isLoading?: boolean;
  queryKey: string;
}>();

const emit = defineEmits<{
  select: [ticker: string];
  buy: [ticker: string];
  sell: [ticker: string];
}>();

const parentRef = ref<HTMLElement | null>(null);

const rowVirtualizer = useVirtualizer({
  count: computed(() => props.stocks.length),
  getScrollElement: () => parentRef.value,
  estimateSize: () => 48,
  overscan: 10,
});

watch(
  () => props.queryKey,
  () => {
    rowVirtualizer.value.scrollToIndex(0, {align: 'start'});
  },
);

const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

function handleSelect(ticker: string) {
  emit('select', ticker);
}

function handleBuy(ticker: string) {
  emit('buy', ticker);
}

function handleSell(ticker: string) {
  emit('sell', ticker);
}
</script>

<template>
  <div
    v-if="isLoading"
    class="flex h-64 items-center justify-center text-muted-foreground"
  >
    Загрузка акций...
  </div>

  <div
    v-else-if="stocks.length === 0"
    class="flex h-64 items-center justify-center text-muted-foreground"
  >
    Акции не найдены
  </div>

  <div
    v-else
    ref="parentRef"
    class="h-[500px] w-full overflow-auto"
    data-testid="stock-table-body"
  >
    <div class="relative w-full" :style="{height: `${totalSize}px`}">
      <div
        v-for="virtualRow in virtualItems"
        :key="stocks[virtualRow.index].ticker"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }"
      >
        <div
          :class="[
            `
              flex cursor-pointer items-center border-b border-gray-100 px-4
              py-2
            `,
            'hover:bg-gray-50',
            selectedTicker === stocks[virtualRow.index].ticker
              ? 'bg-blue-50'
              : '',
          ]"
          :data-testid="`stock-row-${stocks[virtualRow.index].ticker}`"
          @click="handleSelect(stocks[virtualRow.index].ticker)"
        >
          <div class="min-w-12 font-mono font-semibold">
            {{ stocks[virtualRow.index].ticker }}
          </div>
          <div class="min-w-32 whitespace-nowrap">
            {{ stocks[virtualRow.index].name }}
          </div>
          <div class="w-32 text-right font-mono">
            {{
              stocks[virtualRow.index].currentPrice.toLocaleString('ru-RU', {
                style: 'currency',
                currency: 'USD',
              })
            }}
          </div>
          <div
            :class="[
              'w-24 text-right font-mono',
              stocks[virtualRow.index].priceChange24h >= 0
                ? 'text-green-600'
                : 'text-red-600',
            ]"
          >
            {{ stocks[virtualRow.index].priceChange24h >= 0 ? '+' : ''
            }}{{ stocks[virtualRow.index].priceChange24h.toFixed(2) }}%
          </div>
          <div class="w-24 text-right font-mono">
            {{
              stocks[virtualRow.index].quantityInPortfolio.toLocaleString(
                'ru-RU',
              )
            }}
          </div>
          <div class="flex w-48 justify-end gap-2">
            <button
              type="button"
              class="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/80"
              @click.stop="handleBuy(stocks[virtualRow.index].ticker)"
            >
              Купить
            </button>
            <button
              v-if="stocks[virtualRow.index].quantityInPortfolio > 0"
              type="button"
              class="rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-muted"
              @click.stop="handleSell(stocks[virtualRow.index].ticker)"
            >
              Продать
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
