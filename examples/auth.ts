/**
 * Auth example - global navigation outposts with BLOCK and redirect verdicts
 */
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel } from 'vue-router-citadel';

// Maintenance outpost - blocks all navigation when site is under maintenance
// scope defaults to 'global', so it can be omitted
const maintenanceNavigationOutpost = {
  name: 'maintenance',
  priority: 1, // highest priority, processed before other outposts
  handler: ({ verdicts }) => {
    const isMaintenanceMode = localStorage.getItem('maintenance') === 'true';

    if (isMaintenanceMode) {
      return verdicts.BLOCK;
    }

    return verdicts.ALLOW;
  },
};

// Auth outpost - redirects to login if user is not authenticated
const authNavigationOutpost = {
  name: 'auth', // scope defaults to 'global'
  priority: 10,
  handler: ({ verdicts, to }) => {
    const isAuthenticated = Boolean(localStorage.getItem('token'));

    if (to.meta.requiresAuth && !isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    return verdicts.ALLOW;
  },
};

const outposts = [maintenanceNavigationOutpost, authNavigationOutpost];

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/login', name: 'login', component: () => import('./pages/Login.vue') },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
];

// 1. Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 2. Create navigation citadel with outposts
const citadel = createNavigationCitadel(router, {
  outposts,
});

export { router, citadel };
