<script setup lang="ts">
import {computed} from 'vue';

import {usePortfolio} from '../api';
import {selectFormattedBalance, selectFormattedPortfolioValue} from '../model';

const {data: portfolio, isLoading, error} = usePortfolio();

const changeClass = computed(() =>
  portfolio.value && portfolio.value.dailyChangePercent >= 0
    ? 'text-green-600'
    : 'text-red-600',
);

const changeSign = computed(() =>
  portfolio.value && portfolio.value.dailyChangePercent >= 0 ? '+' : '',
);
</script>

<template>
  <div v-if="isLoading" class="rounded-lg bg-white p-4 shadow-sm">
    <div class="animate-pulse">
      <div class="mb-2 h-4 w-1/2 rounded-sm bg-gray-200"></div>
      <div class="h-4 w-1/3 rounded-sm bg-gray-200"></div>
    </div>
  </div>

  <div
    v-else-if="error || !portfolio"
    class="rounded-lg bg-white p-4 text-red-600 shadow-sm"
  >
    Ошибка загрузки портфеля
  </div>

  <div v-else class="rounded-lg bg-white p-4 shadow-sm">
    <div class="grid grid-cols-3 gap-4">
      <div>
        <div class="mb-1 text-sm text-gray-500">Стоимость портфеля</div>
        <div class="text-xl font-bold" data-testid="portfolio-value">
          {{ selectFormattedPortfolioValue(portfolio) }}
        </div>
      </div>
      <div>
        <div class="mb-1 text-sm text-gray-500">Доступный баланс</div>
        <div class="text-xl font-bold" data-testid="available-balance">
          {{ selectFormattedBalance(portfolio) }}
        </div>
      </div>
      <div>
        <div class="mb-1 text-sm text-gray-500">Изменение за день</div>
        <div
          :class="['text-xl font-bold', changeClass]"
          data-testid="daily-change"
        >
          {{ changeSign }}{{ portfolio.dailyChangePercent.toFixed(2) }}%
        </div>
      </div>
    </div>
  </div>
</template>
