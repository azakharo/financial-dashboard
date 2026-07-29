<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{
  class?: string;
}>();

const classes = computed(() =>
  cn(
    `
      group/card-header @container/card-header grid auto-rows-min items-start
      gap-1 rounded-t-xl px-(--card-spacing)
      has-data-[slot=card-action]:grid-cols-[1fr_auto]
      has-data-[slot=card-description]:grid-rows-[auto_auto]
      [.border-b]:pb-(--card-spacing)
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
