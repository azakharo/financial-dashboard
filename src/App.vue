<script setup lang="ts">
import {RouterView} from 'vue-router';
import {VueQueryDevtools} from '@tanstack/vue-query-devtools';
</script>

<template>
  <RouterView />
  <VueQueryDevtools />
</template>
