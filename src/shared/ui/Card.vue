<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = withDefaults(
  defineProps<{
    class?: string;
    size?: 'default' | 'sm';
  }>(),
  {
    class: undefined,
    size: 'default',
  },
);

const classes = computed(() =>
  cn(
    `
      group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl
      bg-card py-(--card-spacing) text-sm text-card-foreground ring-1
      ring-foreground/10 [--card-spacing:--spacing(4)]
      has-data-[slot=card-footer]:pb-0
      has-[>img:first-child]:pt-0
      data-[size=sm]:[--card-spacing:--spacing(3)]
      data-[size=sm]:has-data-[slot=card-footer]:pb-0
      *:[img:first-child]:rounded-t-xl
      *:[img:last-child]:rounded-b-xl
    `,
    props.class,
  ),
);
</script>

<template>
  <div :class="classes" data-slot="card" :data-size="size">
    <slot />
  </div>
</template>
