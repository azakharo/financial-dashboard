import {createRouter, createWebHistory} from 'vue-router';

import DashboardPage from '@/pages/dashboard/ui/DashboardPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DashboardPage,
    },
  ],
});

export default router;
