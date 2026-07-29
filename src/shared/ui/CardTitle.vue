<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{
  class?: string;
}>();

const classes = computed(() =>
  cn(
    `
      font-heading text-base/snug font-medium
      group-data-[size=sm]/card:text-sm
    `,
    props.class,
  ),
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
