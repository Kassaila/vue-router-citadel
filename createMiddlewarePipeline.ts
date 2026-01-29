import type { Router } from 'vue-router';
import type {
  MiddlewareContext,
  MiddlewarePipelineAPI,
  MiddlewarePipelineOptions,
  MiddlewareOptions,
  MiddlewareTypeValue,
  RouterHookType,
} from './types';
import { RouterHook, MiddlewareAction, MiddlewareType } from './types';
import { createMiddlewareRegistry } from './registry';
import { collectMiddlewares, runPipeline, toNavigationGuardReturn } from './pipeline';

/**
 * Creates a middleware pipeline for Vue Router
 *
 * @example
 * ```typescript
 * const pipeline = createMiddlewarePipeline(router, {
 *   debug: true,
 *   onError: (error, ctx) => ({ name: 'error' }),
 * });
 *
 * pipeline.register({
 *   type: MiddlewareType.GLOBAL,
 *   name: 'auth',
 *   priority: 10,
 *   handler: async ({ action, to }) => {
 *     if (!isAuthenticated && to.meta.requiresAuth) {
 *       return { name: 'login' };
 *     }
 *     return action.ALLOW;
 *   },
 * });
 * ```
 */
export const createMiddlewarePipeline = (
  router: Router,
  options: MiddlewarePipelineOptions = {},
): MiddlewarePipelineAPI => {
  const { debug = false } = options;
  const registry = createMiddlewareRegistry();

  /**
   * Store cleanup functions for router hooks
   */
  const cleanupFns: Array<() => void> = [];

  /**
   * Helper to create middleware context
   */
  const createContext = (
    to: Parameters<Parameters<Router['beforeEach']>[0]>[0],
    from: Parameters<Parameters<Router['beforeEach']>[0]>[1],
    hook: RouterHookType,
  ): MiddlewareContext => ({
    action: MiddlewareAction,
    to,
    from,
    router,
    hook,
  });

  /**
   * Register beforeEach hook
   */
  const removeBeforeEach = router.beforeEach(async (to, from) => {
    if (debug) {
      console.warn(`[MiddlewarePipeline] beforeEach: ${from.path} -> ${to.path}`);
    }

    const ctx = createContext(to, from, RouterHook.BEFORE_EACH);
    const middlewares = collectMiddlewares(registry, to, RouterHook.BEFORE_EACH);

    if (middlewares.length === 0) {
      return true;
    }

    if (debug) {
      console.warn(`[MiddlewarePipeline] Running ${middlewares.length} middlewares for beforeEach`);
    }

    const result = await runPipeline(middlewares, ctx, options);

    return toNavigationGuardReturn(result);
  });
  cleanupFns.push(removeBeforeEach);

  /**
   * Register beforeResolve hook
   */
  const removeBeforeResolve = router.beforeResolve(async (to, from) => {
    if (debug) {
      console.warn(`[MiddlewarePipeline] beforeResolve: ${from.path} -> ${to.path}`);
    }

    const ctx = createContext(to, from, RouterHook.BEFORE_RESOLVE);
    const middlewares = collectMiddlewares(registry, to, RouterHook.BEFORE_RESOLVE);

    if (middlewares.length === 0) {
      return true;
    }

    if (debug) {
      console.warn(
        `[MiddlewarePipeline] Running ${middlewares.length} middlewares for beforeResolve`,
      );
    }

    const result = await runPipeline(middlewares, ctx, options);

    return toNavigationGuardReturn(result);
  });
  cleanupFns.push(removeBeforeResolve);

  /**
   * Register afterEach hook
   */
  const removeAfterEach = router.afterEach(async (to, from) => {
    if (debug) {
      console.warn(`[MiddlewarePipeline] afterEach: ${from.path} -> ${to.path}`);
    }

    const ctx = createContext(to, from, RouterHook.AFTER_EACH);
    const middlewares = collectMiddlewares(registry, to, RouterHook.AFTER_EACH);

    if (middlewares.length === 0) {
      return;
    }

    if (debug) {
      console.warn(`[MiddlewarePipeline] Running ${middlewares.length} middlewares for afterEach`);
    }

    /**
     * afterEach doesn't return a value, but we still run the pipeline
     * Errors are handled by onError or thrown
     */
    try {
      await runPipeline(middlewares, ctx, options);
    } catch (error) {
      if (debug) {
        console.error(`[MiddlewarePipeline] Error in afterEach middleware:`, error);
      }
      /**
       * afterEach can't prevent navigation, so we just log the error
       * The onError handler should handle it if provided
       */
    }
  });
  cleanupFns.push(removeAfterEach);

  /**
   * Internal helper to register a single middleware
   */
  const registerOne = (opts: MiddlewareOptions): void => {
    const { type, name, handler, priority, hooks } = opts;

    if (debug) {
      console.warn(`[MiddlewarePipeline] Registering ${type} middleware: ${name}`);
    }

    const middleware = { name, handler, priority, hooks };
    const targetRegistry = type === MiddlewareType.GLOBAL ? registry.global : registry.route;

    switch (type) {
      case MiddlewareType.GLOBAL: {
        if (targetRegistry.has(name)) {
          console.warn(
            `[MiddlewarePipeline] Global middleware "${name}" already exists, replacing...`,
          );
        }
        break;
      }
      case MiddlewareType.ROUTE: {
        if (targetRegistry.has(name)) {
          console.warn(
            `[MiddlewarePipeline] Route middleware "${name}" already exists, replacing...`,
          );
        }
        break;
      }
    }

    targetRegistry.set(name, middleware);
  };

  /**
   * Internal helper to delete a single middleware
   */
  const deleteOne = (type: MiddlewareTypeValue, name: string): boolean => {
    if (debug) {
      console.warn(`[MiddlewarePipeline] Deleting ${type} middleware: ${name}`);
    }

    switch (type) {
      case MiddlewareType.GLOBAL: {
        return registry.global.delete(name);
      }
      case MiddlewareType.ROUTE: {
        return registry.route.delete(name);
      }
    }
  };

  /**
   * Public API
   */
  const api: MiddlewarePipelineAPI = {
    register(opts: MiddlewareOptions | MiddlewareOptions[]): void {
      if (Array.isArray(opts)) {
        for (const opt of opts) {
          registerOne(opt);
        }
      } else {
        registerOne(opts);
      }
    },

    delete(type: MiddlewareTypeValue, name: string | string[]): boolean {
      if (Array.isArray(name)) {
        let allDeleted = true;

        for (const n of name) {
          if (!deleteOne(type, n)) {
            allDeleted = false;
          }
        }

        return allDeleted;
      }

      return deleteOne(type, name);
    },

    getMiddlewares(type: MiddlewareTypeValue): string[] {
      switch (type) {
        case MiddlewareType.GLOBAL: {
          return Array.from(registry.global.keys());
        }
        case MiddlewareType.ROUTE: {
          return Array.from(registry.route.keys());
        }
      }
    },

    destroy(): void {
      if (debug) {
        console.warn(`[MiddlewarePipeline] Destroying pipeline`);
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
