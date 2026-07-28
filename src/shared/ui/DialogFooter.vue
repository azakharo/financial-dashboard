<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{class?: string}>();

const classes = computed(() =>
  cn(
    `
      -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50
      p-4
      sm:flex-row sm:justify-end
    `,
    props.class,
  ),
);
</script>

<template>
  <div :class="classes" data-slot="dialog-footer">
    <slot />
  </div>
</template>
