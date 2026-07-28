<script setup lang="ts">
import {ref, watch} from 'vue';
import {useDebounceFn} from '@vueuse/core';
import {Search} from '@lucide/vue';

import {Input} from '@/shared/ui';
import {useUIStore} from '@/shared/store';

const uiStore = useUIStore();

const inputValue = ref(uiStore.searchQuery);

const debouncedSetQuery = useDebounceFn((value: string) => {
  uiStore.setSearchQuery(value);
}, 500);

watch(inputValue, value => {
  debouncedSetQuery(value);
});
</script>

<template>
  <div class="relative">
    <Search
      class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
    />
    <Input
      v-model="inputValue"
      placeholder="Поиск по тикеру или названию..."
      class="pl-9"
    />
  </div>
</template>
