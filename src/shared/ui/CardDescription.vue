<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{
  class?: string;
}>();

const classes = computed(() =>
  cn('text-sm text-muted-foreground', props.class),
);
</script>

<template>
  <div :class="classes" data-slot="card-description">
    <slot />
  </div>
</template>
