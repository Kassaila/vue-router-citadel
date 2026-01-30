/**
 * Route multiple hooks example - single route outpost handling multiple hooks
 */
import { createRouter, createWebHistory } from 'vue-router';
import {
  createNavigationCitadel,
  NavigationOutpostScopes,
  NavigationHooks,
} from 'vue-router-citadel';

// Admin only outpost - restricts access to admin role, handles beforeResolve and afterEach hooks
const adminOnlyNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'admin-only',
  hooks: [NavigationHooks.BEFORE_RESOLVE, NavigationHooks.AFTER_EACH],
  handler: ({ verdicts, hook }) => {
    switch (hook) {
      case NavigationHooks.BEFORE_RESOLVE: {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (user.role !== 'admin') {
          return { name: 'home' };
        }

        return verdicts.ALLOW;
      }
      case NavigationHooks.AFTER_EACH: {
        // track admin page view or perform cleanup

        return verdicts.ALLOW;
      }
      default: {
        return verdicts.ALLOW;
      }
    }
  },
};

// Moderator only outpost - allows access to admin and moderator roles
const moderatorOnlyNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'moderator-only',
  handler: ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!['admin', 'moderator'].includes(user.role)) {
      return { name: 'home' };
    }

    return verdicts.ALLOW;
  },
};

const outposts = [adminOnlyNavigationOutpost, moderatorOnlyNavigationOutpost];

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./pages/Admin.vue'),
    meta: {
      outposts: [adminOnlyNavigationOutpost.name], // applies admin only outpost
    },
  },
  {
    path: '/moderator',
    name: 'moderator',
    component: () => import('./pages/Moderator.vue'),
    meta: {
      outposts: [moderatorOnlyNavigationOutpost.name], // applies moderator only outpost
    },
  },
];

// 1. Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 2. Create navigation citadel
const citadel = createNavigationCitadel(router);

// 3. Deploy navigation outposts
citadel.deployOutpost(outposts);

export { router, citadel };
