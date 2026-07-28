<script setup lang="ts">
import {computed} from 'vue';
import {DialogOverlay, type DialogOverlayProps} from 'reka-ui';

import {cn} from '@/shared/lib';

const props = defineProps<DialogOverlayProps & {class?: string}>();

const classes = computed(() =>
  cn(
    `
      fixed inset-0 isolate z-50 bg-black/10 duration-100
      data-closed:animate-out data-closed:fade-out-0
      data-open:animate-in data-open:fade-in-0
      supports-backdrop-filter:backdrop-blur-xs
    `,
    props.class,
  ),
);
</script>

<template>
  <DialogOverlay :class="classes">
    <slot />
  </DialogOverlay>
</template>
