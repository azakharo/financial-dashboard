import {createApp} from 'vue';
import {createPinia} from 'pinia';
import {VueQueryPlugin, QueryClient} from '@tanstack/vue-query';
import VueApexCharts from 'vue3-apexcharts';

import App from './App.vue';
import router from './app/router';

import '@fontsource-variable/geist';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      structuralSharing: true,
    },
  },
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueQueryPlugin, {queryClient});
app.use(VueApexCharts);

app.mount('#root');
