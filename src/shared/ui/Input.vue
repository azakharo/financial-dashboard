<script setup lang="ts" generic="T extends string | number">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = withDefaults(
  defineProps<{
    type?: string;
    class?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    min?: number | string;
    max?: number | string;
  }>(),
  {
    type: 'text',
    class: undefined,
    placeholder: undefined,
    disabled: false,
    id: undefined,
    min: undefined,
    max: undefined,
  },
);

const model = defineModel<T>({
  default: '' as T,
});

const classes = computed(() =>
  cn(
    `
      h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5
      py-1 text-base transition-colors outline-none
      file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm
      file:font-medium file:text-foreground
      placeholder:text-muted-foreground
      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
      disabled:pointer-events-none disabled:cursor-not-allowed
      disabled:bg-input/50 disabled:opacity-50
      aria-invalid:border-destructive aria-invalid:ring-3
      aria-invalid:ring-destructive/20
      md:text-sm
      dark:bg-input/30
      dark:disabled:bg-input/80
      dark:aria-invalid:border-destructive/50
      dark:aria-invalid:ring-destructive/40
    `,
    props.class,
  ),
);

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value =
    props.type === 'number' ? Number(target.value) || 0 : target.value;
  model.value = value as T;
}
</script>

<template>
  <input
    :id="id"
    :type="type"
    :class="classes"
    :value="model"
    :placeholder="placeholder"
    :disabled="disabled"
    :min="min"
    :max="max"
    @input="onInput"
  />
</template>
