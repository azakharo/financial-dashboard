<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{
  class?: string;
}>();

const classes = computed(() => cn('px-(--card-spacing)', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
