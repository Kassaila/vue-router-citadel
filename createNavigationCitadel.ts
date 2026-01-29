import type { Router, RouteLocationNormalized } from 'vue-router';
import type {
  NavigationPostContext,
  NavigationCitadelAPI,
  NavigationCitadelOptions,
  NavigationPostOptions,
  NavigationPostScope,
  NavigationHook,
} from './types';
import { NavigationHooks, NavigationPostVerdicts } from './types';
import {
  createNavigationPostRegistry,
  addNavigationPost,
  removeNavigationPost,
  getNavigationPostNames,
} from './navigationRegistry';
import {
  collectNavigationPosts,
  patrolNavigationCitadel,
  toNavigationGuardReturn,
} from './navigationPosts';

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
 * citadel.register({
 *   scope: NavigationPostScopes.GLOBAL,
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
  const registry = createNavigationPostRegistry();

  /**
   * Store cleanup functions for router hooks
   */
  const cleanupFns: Array<() => void> = [];

  /**
   * Helper to create navigation post context
   */
  const createContext = (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    hook: NavigationHook,
  ): NavigationPostContext => ({
    verdicts: NavigationPostVerdicts,
    to,
    from,
    router,
    hook,
  });

  /**
   * Factory to create guard handler for beforeEach/beforeResolve
   */
  const createNavigationGuardHandler =
    (hook: NavigationHook) => async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
      if (debug) {
        console.warn(`[NavigationCitadel] ${hook}: ${from.path} -> ${to.path}`);
      }

      const ctx = createContext(to, from, hook);
      const posts = collectNavigationPosts(registry, to, hook, defaultPriority);

      if (posts.length === 0) {
        return true;
      }

      if (debug) {
        console.warn(`[NavigationCitadel] Patrolling ${posts.length} posts for ${hook}`);
      }

      const outcome = await patrolNavigationCitadel(posts, ctx, options);

      return toNavigationGuardReturn(outcome);
    };

  /**
   * Register beforeEach hook
   */
  cleanupFns.push(router.beforeEach(createNavigationGuardHandler(NavigationHooks.BEFORE_EACH)));

  /**
   * Register beforeResolve hook
   */
  cleanupFns.push(router.beforeResolve(createNavigationGuardHandler(NavigationHooks.BEFORE_RESOLVE)));

  /**
   * Register afterEach hook
   */
  const removeAfterEach = router.afterEach(async (to, from) => {
    if (debug) {
      console.warn(`[NavigationCitadel] ${NavigationHooks.AFTER_EACH}: ${from.path} -> ${to.path}`);
    }

    const ctx = createContext(to, from, NavigationHooks.AFTER_EACH);
    const posts = collectNavigationPosts(registry, to, NavigationHooks.AFTER_EACH, defaultPriority);

    if (posts.length === 0) {
      return;
    }

    if (debug) {
      console.warn(`[NavigationCitadel] Patrolling ${posts.length} posts for ${NavigationHooks.AFTER_EACH}`);
    }

    /**
     * afterEach doesn't return a value, but we still patrol
     * Errors are handled by onError or thrown
     */
    try {
      await patrolNavigationCitadel(posts, ctx, options);
    } catch (error) {
      if (debug) {
        console.error(`[NavigationCitadel] Error in afterEach post:`, error);
      }
      /**
       * afterEach can't prevent navigation, so we just log the error
       * The onError handler should handle it if provided
       */
    }
  });
  
  cleanupFns.push(removeAfterEach);

  /**
   * Internal helper to register a single post
   */
  const registerOne = (opts: NavigationPostOptions): void => {
    const { scope, name, handler, priority, hooks } = opts;

    if (debug) {
      console.warn(`[NavigationCitadel] Registering ${scope} post: ${name}`);
    }

    addNavigationPost(registry, scope, { name, handler, priority, hooks });
  };

  /**
   * Internal helper to delete a single post
   */
  const deleteOne = (scope: NavigationPostScope, name: string): boolean => {
    if (debug) {
      console.warn(`[NavigationCitadel] Deleting ${scope} post: ${name}`);
    }

    return removeNavigationPost(registry, scope, name);
  };

  /**
   * Public API
   */
  const api: NavigationCitadelAPI = {
    register(opts: NavigationPostOptions | NavigationPostOptions[]): void {
      if (Array.isArray(opts)) {
        for (const opt of opts) {
          registerOne(opt);
        }
      } else {
        registerOne(opts);
      }
    },

    delete(scope: NavigationPostScope, name: string | string[]): boolean {
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

    getPosts(scope: NavigationPostScope): string[] {
      return getNavigationPostNames(registry, scope);
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
