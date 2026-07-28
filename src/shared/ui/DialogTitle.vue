<script setup lang="ts">
import {computed} from 'vue';
import {DialogTitle, type DialogTitleProps} from 'reka-ui';

import {cn} from '@/shared/lib';

const props = defineProps<DialogTitleProps & {class?: string}>();

const classes = computed(() =>
  cn('font-heading text-base leading-none font-medium', props.class),
);
</script>

<template>
  <DialogTitle :class="classes" data-slot="dialog-title">
    <slot />
  </DialogTitle>
</template>
