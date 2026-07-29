<script setup lang="ts">
import {DialogRoot, type DialogRootEmits, type DialogRootProps} from 'reka-ui';

const props = defineProps<DialogRootProps>();
const emit = defineEmits<DialogRootEmits>();
</script>

<template>
  <DialogRoot v-bind="props" @update:open="emit('update:open', $event)">
    <slot />
  </DialogRoot>
</template>
