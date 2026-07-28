<script setup lang="ts">
import {computed} from 'vue';
import {DialogDescription, type DialogDescriptionProps} from 'reka-ui';

import {cn} from '@/shared/lib';

const props = defineProps<DialogDescriptionProps & {class?: string}>();

const classes = computed(() =>
  cn(
    `
      text-sm text-muted-foreground
      *:[a]:underline *:[a]:underline-offset-3
      *:[a]:hover:text-foreground
    `,
    props.class,
  ),
);
</script>

<template>
  <DialogDescription :class="classes" data-slot="dialog-description">
    <slot />
  </DialogDescription>
</template>
