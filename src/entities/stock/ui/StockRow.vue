<script setup lang="ts">
import {computed} from 'vue';
import type {Stock} from '@/shared/api';
import {Button} from '@/shared/ui';

const props = defineProps<{
  stock: Stock;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  select: [ticker: string];
  buy: [ticker: string];
  sell: [ticker: string];
}>();

const priceChangeClass = computed(() =>
  props.stock.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600',
);

const rowClass = computed(
  () => `
  flex cursor-pointer items-center border-b border-gray-100 px-4 py-2
  hover:bg-gray-50
  ${props.isSelected ? 'bg-blue-50' : ''}
`,
);

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function handleRowClick() {
  emit('select', props.stock.ticker);
}

function handleBuy(e: Event) {
  e.stopPropagation();
  emit('buy', props.stock.ticker);
}

function handleSell(e: Event) {
  e.stopPropagation();
  emit('sell', props.stock.ticker);
}
</script>

<template>
  <div
    :class="rowClass"
    :data-testid="`stock-row-${stock.ticker}`"
    @click="handleRowClick"
  >
    <div class="min-w-12 font-mono font-semibold">{{ stock.ticker }}</div>
    <div class="min-w-32 whitespace-nowrap">{{ stock.name }}</div>
    <div class="w-32 text-right font-mono">
      {{ formatPrice(stock.currentPrice) }}
    </div>
    <div :class="['w-24 text-right font-mono', priceChangeClass]">
      {{ formatChange(stock.priceChange24h) }}
    </div>
    <div class="w-24 text-right font-mono">
      {{ stock.quantityInPortfolio.toLocaleString('ru-RU') }}
    </div>
    <div class="flex w-48 justify-end gap-2">
      <Button size="sm" variant="default" @click="handleBuy"> Купить </Button>
      <Button
        v-if="stock.quantityInPortfolio > 0"
        size="sm"
        variant="outline"
        @click="handleSell"
      >
        Продать
      </Button>
    </div>
  </div>
</template>
