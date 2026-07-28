<script setup lang="ts">
import {computed} from 'vue';
import {DialogContent, type DialogContentProps} from 'reka-ui';
import {XIcon} from '@lucide/vue';

import {cn} from '@/shared/lib';
import Button from './Button.vue';
import DialogPortal from './DialogPortal.vue';
import DialogOverlay from './DialogOverlay.vue';
import DialogClose from './DialogClose.vue';

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: string;
      showCloseButton?: boolean;
    }
  >(),
  {
    class: undefined,
    showCloseButton: true,
  },
);

const classes = computed(() =>
  cn(
    `
      fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)]
      -translate-1/2 gap-4 rounded-xl bg-popover p-4 text-sm
      text-popover-foreground ring-1 ring-foreground/10 duration-100
      outline-none
      data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
      data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
      sm:max-w-sm
    `,
    props.class,
  ),
);
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent :class="classes" data-slot="dialog-content">
      <slot />
      <DialogClose v-if="showCloseButton" as-child>
        <Button variant="ghost" class="absolute top-2 right-2" size="icon-sm">
          <XIcon />
          <span class="sr-only">Закрыть</span>
        </Button>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
