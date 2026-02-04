/**
 * Global different hooks example - global outposts using beforeEach, beforeResolve, afterEach hooks
 */
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel, NavigationHooks } from 'vue-router-citadel';

// Auth outpost (beforeEach) - checks authentication on every navigation
// scope defaults to 'global', so it can be omitted
const authNavigationOutpost = {
  name: 'auth',
  priority: 10,
  handler: ({ verdicts, to }) => {
    const isAuthenticated = Boolean(localStorage.getItem('token'));

    if (to.meta.requiresAuth && !isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    return verdicts.ALLOW;
  },
};

// Data loader outpost (beforeResolve) - loads async data before component resolves
const dataLoaderNavigationOutpost = {
  name: 'data-loader',
  hooks: [NavigationHooks.BEFORE_RESOLVE],
  handler: async ({ verdicts, to }) => {
    // await loadPageData(to);

    return verdicts.ALLOW;
  },
};

// Analytics outpost (afterEach) - tracks page views after navigation completes
const analyticsNavigationOutpost = {
  name: 'analytics',
  hooks: [NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, to }) => {
    // analytics.track('page_view', { path: to.path });

    return verdicts.ALLOW;
  },
};

// Page title outpost (afterEach) - updates document title after navigation completes
const pageTitleNavigationOutpost = {
  name: 'page-title',
  hooks: [NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, to }) => {
    document.title = (to.meta.title as string) || 'My App';

    return verdicts.ALLOW;
  },
};

const outposts = [
  authNavigationOutpost,
  dataLoaderNavigationOutpost,
  analyticsNavigationOutpost,
  pageTitleNavigationOutpost,
];

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/Home.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('./pages/About.vue'),
    meta: { title: 'About Us' },
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
  debug: true,
});

export { router, citadel };
