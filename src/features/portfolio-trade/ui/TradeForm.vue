<script setup lang="ts">
import {ref, computed} from 'vue';

import {Button} from '@/shared/ui';
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

function handleQuantityChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = parseInt(target.value, 10);
  quantity.value = Number.isNaN(value) ? 0 : value;
  error.value = undefined;
}

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
        Текущая цена:
        {{
          stock.currentPrice.toLocaleString('ru-RU', {
            style: 'currency',
            currency: 'USD',
          })
        }}
      </div>
    </div>

    <div class="space-y-2">
      <label for="quantity" class="text-sm font-medium"> Количество </label>
      <input
        id="quantity"
        type="number"
        :min="1"
        :max="mode === 'sell' ? quantityInPortfolio : undefined"
        :value="quantity"
        :disabled="isPending"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        @input="handleQuantityChange"
      />
      <div v-if="mode === 'sell'" class="text-xs text-muted-foreground">
        Доступно для продажи: {{ quantityInPortfolio }}
      </div>
    </div>

    <div class="rounded-md bg-muted p-3">
      <div class="text-sm text-muted-foreground">Итого к оплате:</div>
      <div class="text-xl font-bold">
        {{
          totalCost.toLocaleString('ru-RU', {
            style: 'currency',
            currency: 'USD',
          })
        }}
      </div>
      <div v-if="mode === 'buy'" class="text-xs text-muted-foreground">
        Доступно:
        {{
          availableBalance.toLocaleString('ru-RU', {
            style: 'currency',
            currency: 'USD',
          })
        }}
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
