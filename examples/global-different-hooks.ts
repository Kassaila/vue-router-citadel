/**
 * Global different hooks example - global outposts using beforeEach, beforeResolve, afterEach hooks
 */
import { createRouter, createWebHistory } from 'vue-router';
import {
  createNavigationCitadel,
  NavigationOutpostScopes,
  NavigationHooks,
} from 'vue-router-citadel';

// Auth outpost (beforeEach) - checks authentication on every navigation
const authNavigationOutpost = {
  scope: NavigationOutpostScopes.GLOBAL,
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
  scope: NavigationOutpostScopes.GLOBAL,
  name: 'data-loader',
  hooks: [NavigationHooks.BEFORE_RESOLVE],
  handler: async ({ verdicts, to }) => {
    // await loadPageData(to);

    return verdicts.ALLOW;
  },
};

// Analytics outpost (afterEach) - tracks page views after navigation completes
const analyticsNavigationOutpost = {
  scope: NavigationOutpostScopes.GLOBAL,
  name: 'analytics',
  hooks: [NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, to }) => {
    // analytics.track('page_view', { path: to.path });

    return verdicts.ALLOW;
  },
};

// Page title outpost (afterEach) - updates document title after navigation completes
const pageTitleNavigationOutpost = {
  scope: NavigationOutpostScopes.GLOBAL,
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

// 2. Create navigation citadel
const citadel = createNavigationCitadel(router, { debug: true });

// 3. Deploy navigation outposts
citadel.deploy(outposts);

export { router, citadel };
