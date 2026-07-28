<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{
  class?: string;
}>();

const classes = computed(() =>
  cn(
    'flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)',
    props.class,
  ),
);
</script>

<template>
  <div :class="classes" data-slot="card-footer">
    <slot />
  </div>
</template>
