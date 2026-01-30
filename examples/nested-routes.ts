/**
 * Nested routes example - route outposts inheritance from parent routes
 *
 * Route outposts are:
 * - Sorted by priority (lower = processed first)
 * - Deduplicated (same outpost in parent and child runs only once)
 */
import { createRouter, createWebHistory } from 'vue-router';
import { createNavigationCitadel, NavigationOutpostScopes } from 'vue-router-citadel';

// Auth outpost - redirects to home if user is not authenticated
// Priority 10 - runs first (lower = earlier)
const authNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'auth',
  priority: 10,
  handler: ({ verdicts }) => {
    const token = localStorage.getItem('token');

    if (!token) {
      return { name: 'home' };
    }

    return verdicts.ALLOW;
  },
};

// Verified outpost - requires user email to be verified
// Priority 20 - runs after auth
const verifiedNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'verified',
  priority: 20,
  handler: ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.emailVerified) {
      return { name: 'account' }; // redirect to account page to verify email
    }

    return verdicts.ALLOW;
  },
};

// Premium outpost - requires user to have premium subscription
// Priority 30 - runs after verified
const premiumNavigationOutpost = {
  scope: NavigationOutpostScopes.ROUTE,
  name: 'premium',
  priority: 30,
  handler: ({ verdicts }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.isPremium) {
      return { name: 'account-settings' }; // redirect to settings page to upgrade subscription
    }

    return verdicts.ALLOW;
  },
};

const outposts = [authNavigationOutpost, verifiedNavigationOutpost, premiumNavigationOutpost];

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  {
    path: '/account',
    component: () => import('./layouts/AccountLayout.vue'),
    meta: {
      outposts: [authNavigationOutpost.name], // all child routes inherit auth outpost
    },
    children: [
      {
        path: '',
        name: 'account',
        component: () => import('./pages/Account.vue'),
        // inherits auth outpost from parent
      },
      {
        path: 'settings',
        name: 'account-settings',
        component: () => import('./pages/AccountSettings.vue'),
        meta: {
          outposts: [verifiedNavigationOutpost.name], // inherits auth outpost, adds verified outpost
        },
      },
      {
        path: 'billing',
        name: 'account-billing',
        component: () => import('./pages/AccountBilling.vue'),
        meta: {
          outposts: [verifiedNavigationOutpost.name, premiumNavigationOutpost.name], // inherits auth outpost, adds verified and premium outposts
        },
      },
    ],
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
citadel.deploy(outposts);

export { router, citadel };
