<script setup lang="ts">
import {usePriceUpdate} from '@/features/price-update';
import PortfolioInfo from '@/entities/portfolio/ui/PortfolioInfo.vue';
import {StockTable} from '@/widgets/stock-table';
import {StockChart} from '@/widgets/stock-chart';
import TradeModal from '@/features/portfolio-trade/ui/TradeModal.vue';

usePriceUpdate();
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="mx-auto space-y-4">
      <PortfolioInfo />
      <div class="grid gap-4 lg:grid-cols-2">
        <StockTable />
        <StockChart />
      </div>
      <TradeModal />
    </div>
  </div>
</template>
