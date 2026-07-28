<script setup lang="ts">
import {DialogRoot, type DialogRootProps} from 'reka-ui';

const props = defineProps<DialogRootProps>();
</script>

<template>
  <DialogRoot v-bind="props" data-slot="dialog">
    <slot />
  </DialogRoot>
</template>
