<script setup lang="ts">
import {computed} from 'vue';

import {cn} from '@/shared/lib';

const props = defineProps<{class?: string}>();

const classes = computed(() => cn('flex flex-col gap-2', props.class));
</script>

<template>
  <div :class="classes" data-slot="dialog-header">
    <slot />
  </div>
</template>
