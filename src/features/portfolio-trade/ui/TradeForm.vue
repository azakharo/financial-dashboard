<script setup lang="ts">
import {ref, computed, watch} from 'vue';

import {Button, Input} from '@/shared/ui';
import {formatPrice} from '@/shared/lib/format';
import type {Stock, TradeMode} from '@/shared/api';
import {usePortfolio} from '@/entities/portfolio';
import {useUIStore} from '@/shared/store';

import {useBuyStock, useSellStock} from '../api';
import {
  calculateTotalCost,
  validateBuy,
  validateSell,
} from '../model/validation';

const props = defineProps<{
  stock: Stock | undefined;
  mode: TradeMode;
}>();

const emit = defineEmits<{
  success: [];
}>();

const quantity = ref(1);
const error = ref<string | undefined>();

watch(quantity, () => {
  error.value = undefined;
});

const {data: portfolio} = usePortfolio();
const uiStore = useUIStore();

const buyMutation = useBuyStock();
const sellMutation = useSellStock();

const mutation = computed(() =>
  props.mode === 'buy' ? buyMutation : sellMutation,
);

const isPending = computed(() => mutation.value.isPending.value);

const availableBalance = computed(() => portfolio.value?.availableBalance ?? 0);
const quantityInPortfolio = computed(
  () => props.stock?.quantityInPortfolio ?? 0,
);

const totalCost = computed(() =>
  props.stock
    ? calculateTotalCost(quantity.value, props.stock.currentPrice)
    : 0,
);

const validation = computed(() => {
  if (!props.stock) return {isValid: false, error: 'Акция не выбрана'};

  if (props.mode === 'buy') {
    return validateBuy(quantity.value, availableBalance.value, props.stock);
  }

  return validateSell(quantity.value, props.stock);
});

function handleSubmit(e: Event) {
  e.preventDefault();

  if (!validation.value.isValid) {
    error.value = validation.value.error;
    return;
  }

  if (!props.stock) return;

  mutation.value.mutate(
    {ticker: props.stock.ticker, quantity: quantity.value},
    {
      onSuccess: () => {
        uiStore.closeTradeModal();
        emit('success');
      },
      onError: () => {
        error.value = 'Ошибка при выполнении операции';
      },
    },
  );
}

function handleClose() {
  uiStore.closeTradeModal();
}
</script>

<template>
  <div v-if="!stock" class="text-muted-foreground">Акция не найдена</div>

  <form v-else class="space-y-4" @submit="handleSubmit">
    <div class="space-y-2">
      <label class="text-sm font-medium">Акция</label>
      <div class="text-lg font-semibold">
        {{ stock.ticker }} — {{ stock.name }}
      </div>
      <div class="text-sm text-muted-foreground">
        Текущая цена: {{ formatPrice(stock.currentPrice) }}
      </div>
    </div>

    <div class="space-y-2">
      <label for="quantity" class="text-sm font-medium"> Количество </label>
      <Input
        id="quantity"
        v-model="quantity"
        type="number"
        :min="1"
        :max="mode === 'sell' ? quantityInPortfolio : undefined"
        :disabled="isPending"
      />
      <div v-if="mode === 'sell'" class="text-xs text-muted-foreground">
        Доступно для продажи: {{ quantityInPortfolio }}
      </div>
    </div>

    <div class="rounded-md bg-muted p-3">
      <div class="text-sm text-muted-foreground">Итого к оплате:</div>
      <div class="text-xl font-bold">{{ formatPrice(totalCost) }}</div>
      <div v-if="mode === 'buy'" class="text-xs text-muted-foreground">
        Доступно: {{ formatPrice(availableBalance) }}
      </div>
    </div>

    <div v-if="error" class="text-sm text-destructive">{{ error }}</div>

    <div class="flex gap-2">
      <Button
        type="button"
        variant="outline"
        :disabled="isPending"
        class="flex-1"
        @click="handleClose"
      >
        Отмена
      </Button>
      <Button
        type="submit"
        :disabled="!validation.isValid || isPending"
        class="flex-1"
      >
        {{ isPending ? 'Обработка...' : mode === 'buy' ? 'Купить' : 'Продать' }}
      </Button>
    </div>
  </form>
</template>
