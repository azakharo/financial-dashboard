<script setup lang="ts">
import {computed} from 'vue';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';

import {Card, CardContent, CardHeader, Badge} from '@/shared/ui';
import {useStockHistory} from '@/entities/price-history';
import {useUIStore, storeToRefs} from '@/shared/store';
import type {Timeframe, PricePoint} from '@/shared/api';

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '1Y'];

function formatXAxisTimestamp(ts: number, timeframe: Timeframe): string {
  const date = new Date(ts);
  switch (timeframe) {
    case '1D':
      return format(date, 'HH:mm');
    case '1W':
      return format(date, 'eeee', {locale: ru});
    case '1M':
      return format(date, 'dd.MM');
    case '1Y':
      return format(date, 'LLL', {locale: ru});
    default:
      return format(date, 'd MMM', {locale: ru});
  }
}

function formatTooltipTimestamp(timestamp: Date): string {
  return format(timestamp, 'd MMM, HH:mm', {locale: ru});
}

interface ChartDataPoint {
  x: number;
  y: number;
  timestamp: Date;
}

function prepareChartData(points: PricePoint[]): ChartDataPoint[] {
  return points.map(p => ({
    x: p.timestamp.getTime(),
    y: p.price,
    timestamp: p.timestamp,
  }));
}

const uiStore = useUIStore();
const {selectedTicker, chartTimeframe} = storeToRefs(uiStore);

const {data, isLoading} = useStockHistory(selectedTicker, chartTimeframe);

const preparedData = computed(() => prepareChartData(data.value ?? []));

const latestPrice = computed(() => data.value?.[data.value.length - 1]?.price);
const previousPrice = computed(
  () => data.value?.[data.value.length - 2]?.price,
);
const priceChange = computed(() => {
  if (latestPrice.value !== undefined && previousPrice.value !== undefined) {
    return (
      ((latestPrice.value - previousPrice.value) / previousPrice.value) * 100
    );
  }
  return 0;
});

const chartOptions = computed(() => ({
  chart: {
    type: 'area' as const,
    animations: {enabled: false},
    toolbar: {show: false},
    zoom: {enabled: false},
  },
  stroke: {
    curve: 'monotoneCubic' as const,
    width: 2,
  },
  fill: {
    type: 'gradient' as const,
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.3,
      opacityTo: 0,
      stops: [0, 100],
    },
  },
  xaxis: {
    type: 'datetime' as const,
    labels: {
      formatter: (value: number) =>
        formatXAxisTimestamp(value, chartTimeframe.value),
      style: {fontSize: '12px'},
    },
    axisBorder: {show: false},
    axisTicks: {show: false},
  },
  yaxis: {
    labels: {
      formatter: (value: number) => `$${value.toFixed(0)}`,
      style: {fontSize: '12px'},
    },
  },
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 3,
  },
  tooltip: {
    custom: ({dataPointIndex}: {dataPointIndex: number}) => {
      const point = preparedData.value[dataPointIndex];
      if (!point) return '';
      return `
        <div class="rounded-lg border bg-white p-2 shadow-sm">
          <div class="text-xs text-gray-500">${formatTooltipTimestamp(point.timestamp)}</div>
          <div class="font-mono font-semibold">${point.y.toLocaleString('ru-RU', {style: 'currency', currency: 'USD'})}</div>
        </div>
      `;
    },
  },
}));

const series = computed(() => [
  {
    name: 'Цена',
    data: preparedData.value,
  },
]);

function handleTimeframeChange(timeframe: Timeframe) {
  uiStore.setChartTimeframe(timeframe);
}
</script>

<template>
  <Card v-if="!selectedTicker">
    <CardHeader>
      <div class="text-lg font-semibold">График акции</div>
    </CardHeader>
    <CardContent
      class="flex h-80 items-center justify-center text-muted-foreground"
    >
      Выберите акцию в таблице для отображения графика
    </CardContent>
  </Card>

  <Card v-else-if="isLoading">
    <CardHeader>
      <div class="text-lg font-semibold">{{ selectedTicker }}</div>
    </CardHeader>
    <CardContent
      class="flex h-80 items-center justify-center text-muted-foreground"
    >
      Загрузка данных...
    </CardContent>
  </Card>

  <Card v-else-if="!data || data.length === 0">
    <CardHeader>
      <div class="text-lg font-semibold">{{ selectedTicker }}</div>
    </CardHeader>
    <CardContent
      class="flex h-80 items-center justify-center text-muted-foreground"
    >
      Нет данных для отображения
    </CardContent>
  </Card>

  <Card v-else>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ selectedTicker }}
          <span
            v-if="latestPrice !== undefined"
            class="ml-4 text-base font-normal text-muted-foreground"
          >
            {{
              latestPrice.toLocaleString('ru-RU', {
                style: 'currency',
                currency: 'USD',
              })
            }}
            <span
              :class="[
                'ml-2',
                priceChange >= 0 ? 'text-green-600' : 'text-red-600',
              ]"
            >
              {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
            </span>
          </span>
        </div>
        <div class="flex gap-2">
          <Badge
            v-for="tf in TIMEFRAMES"
            :key="tf"
            :variant="chartTimeframe === tf ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="handleTimeframeChange(tf)"
          >
            {{ tf }}
          </Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="h-80" data-testid="stock-chart-container">
        <apexchart
          type="area"
          :options="chartOptions"
          :series="series"
          height="320"
        />
      </div>
    </CardContent>
  </Card>
</template>
