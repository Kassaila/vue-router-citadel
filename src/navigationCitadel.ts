import type { Router, RouteLocationNormalized } from 'vue-router';

import type {
  NavigationOutpostContext,
  NavigationCitadelAPI,
  NavigationCitadelOptions,
  NavigationOutpostOptions,
  NavigationOutpostScope,
  NavigationHook,
} from './types';
import { NavigationHooks, NavigationOutpostVerdicts } from './types';
import {
  createNavigationOutpostRegistry,
  addNavigationOutpost,
  removeNavigationOutpost,
  getNavigationOutpostNames,
} from './navigationRegistry';
import {
  collectNavigationOutposts,
  patrolNavigationCitadel,
  toNavigationGuardReturn,
} from './navigationOutposts';

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
  const { debug = false, defaultPriority } = options;
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
      if (debug) {
        console.warn(`[NavigationCitadel] ${hook}: ${from.path} -> ${to.path}`);
      }

      const ctx = createContext(to, from, hook);
      const outposts = collectNavigationOutposts(registry, to, hook, defaultPriority);

      if (outposts.length === 0) {
        return true;
      }

      if (debug) {
        console.warn(`[NavigationCitadel] Patrolling ${outposts.length} outposts for ${hook}`);
      }

      const outcome = await patrolNavigationCitadel(outposts, ctx, options);

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
    if (debug) {
      console.warn(`[NavigationCitadel] ${NavigationHooks.AFTER_EACH}: ${from.path} -> ${to.path}`);
    }

    const ctx = createContext(to, from, NavigationHooks.AFTER_EACH);
    const outposts = collectNavigationOutposts(
      registry,
      to,
      NavigationHooks.AFTER_EACH,
      defaultPriority,
    );

    if (outposts.length === 0) {
      return;
    }

    if (debug) {
      console.warn(
        `[NavigationCitadel] Patrolling ${outposts.length} outposts for ${NavigationHooks.AFTER_EACH}`,
      );
    }

    /**
     * afterEach doesn't return a value, but we still patrol
     * Errors are handled by onError or thrown
     */
    try {
      await patrolNavigationCitadel(outposts, ctx, options);
    } catch (error) {
      if (debug) {
        console.error(`[NavigationCitadel] Error in afterEach outpost:`, error);
      }
      /**
       * afterEach can't prevent navigation, so we just log the error
       * The onError handler should handle it if provided
       */
    }
  });

  cleanupFns.push(removeAfterEach);

  /**
   * Internal helper to deploy a single outpost
   */
  const registerOne = (opts: NavigationOutpostOptions): void => {
    const { scope, name, handler, priority, hooks } = opts;

    if (debug) {
      console.warn(`[NavigationCitadel] Registering ${scope} outpost: ${name}`);
    }

    addNavigationOutpost(registry, scope, { name, handler, priority, hooks });
  };

  /**
   * Internal helper to abandon a single outpost
   */
  const deleteOne = (scope: NavigationOutpostScope, name: string): boolean => {
    if (debug) {
      console.warn(`[NavigationCitadel] Deleting ${scope} outpost: ${name}`);
    }

    return removeNavigationOutpost(registry, scope, name);
  };

  /**
   * Public API
   */
  const api: NavigationCitadelAPI = {
    deploy(opts: NavigationOutpostOptions | NavigationOutpostOptions[]): void {
      if (Array.isArray(opts)) {
        for (const opt of opts) {
          registerOne(opt);
        }
      } else {
        registerOne(opts);
      }
    },

    abandon(scope: NavigationOutpostScope, name: string | string[]): boolean {
      if (Array.isArray(name)) {
        let allDeleted = true;

        for (const n of name) {
          if (!deleteOne(scope, n)) {
            allDeleted = false;
          }
        }

        return allDeleted;
      }

      return deleteOne(scope, name);
    },

    getOutposts(scope: NavigationOutpostScope): string[] {
      return getNavigationOutpostNames(registry, scope);
    },

    destroy(): void {
      if (debug) {
        console.warn(`[NavigationCitadel] Destroying citadel`);
      }

      for (const cleanup of cleanupFns) {
        cleanup();
      }

      cleanupFns.length = 0;
      registry.global.clear();
      registry.route.clear();
    },
  };

  return api;
};
