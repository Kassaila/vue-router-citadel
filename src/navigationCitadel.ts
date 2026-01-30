import type { Router, RouteLocationNormalized } from 'vue-router';

import type {
  NavigationOutpostContext,
  NavigationCitadelAPI,
  NavigationCitadelOptions,
  NavigationOutpostOptions,
  NavigationOutpostScope,
  NavigationHook,
} from './types';
import { NavigationHooks, NavigationOutpostVerdicts, DebugPoints } from './types';
import { LOG_PREFIX } from './consts';
import { debugPoint } from './helpers';
import {
  createNavigationOutpostRegistry,
  addNavigationOutpost,
  removeNavigationOutpost,
  getNavigationOutpostNames,
} from './navigationRegistry';
import { patrolNavigationCitadel, toNavigationGuardReturn } from './navigationOutposts';

/**
 * Creates a navigation citadel for Vue Router
 *
 * @example
 * ```typescript
 * const citadel = createNavigationCitadel(router, {
 *   debug: true,
 *   onError: (error, ctx) => ({ name: 'error' }),
 * });
 *
 * citadel.deploy({
 *   scope: NavigationOutpostScopes.GLOBAL,
 *   name: 'auth',
 *   priority: 10,
 *   handler: async ({ verdicts, to }) => {
 *     if (!isAuthenticated && to.meta.requiresAuth) {
 *       return { name: 'login' };
 *     }
 *     return verdicts.ALLOW;
 *   },
 * });
 * ```
 */
export const createNavigationCitadel = (
  router: Router,
  options: NavigationCitadelOptions = {},
): NavigationCitadelAPI => {
  const { log = true, debug = false, defaultPriority } = options;
  const enableLog = log || debug;
  const registry = createNavigationOutpostRegistry();

  /**
   * Store cleanup functions for navigation hooks
   */
  const cleanupFns: Array<() => void> = [];

  /**
   * Helper to create navigation outpost context
   */
  const createContext = (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    hook: NavigationHook,
  ): NavigationOutpostContext => ({
    verdicts: NavigationOutpostVerdicts,
    to,
    from,
    router,
    hook,
  });

  /**
   * Factory to create guard handler for beforeEach/beforeResolve
   */
  const createNavigationGuardHandler =
    (hook: NavigationHook) =>
    async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
      if (enableLog) {
        console.info(`🔵 ${LOG_PREFIX} ${hook}: ${from.path} -> ${to.path}`);
      }

      debugPoint(DebugPoints.NAVIGATION_START, debug);

      const ctx = createContext(to, from, hook);
      const outcome = await patrolNavigationCitadel(registry, ctx, options);

      return toNavigationGuardReturn(outcome);
    };

  /**
   * Register beforeEach hook
   */
  cleanupFns.push(router.beforeEach(createNavigationGuardHandler(NavigationHooks.BEFORE_EACH)));

  /**
   * Register beforeResolve hook
   */
  cleanupFns.push(
    router.beforeResolve(createNavigationGuardHandler(NavigationHooks.BEFORE_RESOLVE)),
  );

  /**
   * Register afterEach hook
   */
  const removeAfterEach = router.afterEach(async (to, from) => {
    if (enableLog) {
      console.info(`🔵 ${LOG_PREFIX} ${NavigationHooks.AFTER_EACH}: ${from.path} -> ${to.path}`);
    }

    debugPoint(DebugPoints.NAVIGATION_START, debug);

    const ctx = createContext(to, from, NavigationHooks.AFTER_EACH);

    /**
     * afterEach doesn't return a value, but we still patrol
     * Errors are handled by onError or logged here
     */
    try {
      await patrolNavigationCitadel(registry, ctx, options);
    } catch (error) {
      console.error(`🔴 ${LOG_PREFIX} Error in afterEach outpost:`, error);
      debugPoint(DebugPoints.ERROR_CAUGHT, debug);
    }
  });

  cleanupFns.push(removeAfterEach);

  /**
   * Deploy a single outpost
   */
  const deployOne = (opts: NavigationOutpostOptions): void => {
    const { scope, name, handler, priority, hooks } = opts;

    if (enableLog) {
      console.info(`🔵 ${LOG_PREFIX} Deploying ${scope} outpost: ${name}`);
    }

    addNavigationOutpost(registry, scope, { name, handler, priority, hooks }, defaultPriority);
  };

  /**
   * Abandon a single outpost
   */
  const abandonOne = (scope: NavigationOutpostScope, name: string): boolean => {
    if (enableLog) {
      console.info(`🔵 ${LOG_PREFIX} Abandoning ${scope} outpost: ${name}`);
    }

    return removeNavigationOutpost(registry, scope, name, defaultPriority);
  };

  /**
   * Public API
   */
  const api: NavigationCitadelAPI = {
    deploy(opts: NavigationOutpostOptions | NavigationOutpostOptions[]): void {
      if (Array.isArray(opts)) {
        for (const opt of opts) {
          deployOne(opt);
        }
      } else {
        deployOne(opts);
      }
    },

    abandon(scope: NavigationOutpostScope, name: string | string[]): boolean {
      if (Array.isArray(name)) {
        let allDeleted = true;

        for (const n of name) {
          if (!abandonOne(scope, n)) {
            allDeleted = false;
          }
        }

        return allDeleted;
      }

      return abandonOne(scope, name);
    },

    getOutposts(scope: NavigationOutpostScope): string[] {
      return getNavigationOutpostNames(registry, scope);
    },

    assignOutpostToRoute(routeName: string, outpostNames: string | string[]): boolean {
      const routes = router.getRoutes();
      const route = routes.find((r) => r.name === routeName);

      if (!route) {
        console.warn(`🟡 ${LOG_PREFIX} Route "${routeName}" not found`);

        return false;
      }

      const names = Array.isArray(outpostNames) ? outpostNames : [outpostNames];

      if (!route.meta.outposts) {
        route.meta.outposts = [];
      }

      for (const name of names) {
        if (!route.meta.outposts.includes(name)) {
          route.meta.outposts.push(name);
        }
      }

      if (enableLog) {
        console.info(
          `🔵 ${LOG_PREFIX} Assigned outposts [${names.join(', ')}] to route "${routeName}"`,
        );
      }

      return true;
    },

    destroy(): void {
      if (enableLog) {
        console.info(`🔵 ${LOG_PREFIX} Destroying citadel`);
      }

      for (const cleanup of cleanupFns) {
        cleanup();
      }

      cleanupFns.length = 0;
      registry.global.clear();
      registry.route.clear();
      registry.globalSorted.length = 0;
      registry.routeSorted.length = 0;
    },
  };

  return api;
};
