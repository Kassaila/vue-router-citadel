import type { App } from 'vue';
import type { Router, RouteLocationNormalized } from 'vue-router';

import type {
  NavigationOutpostContext,
  NavigationCitadelAPI,
  NavigationCitadelOptions,
  NavigationOutpost,
  NavigationOutpostScope,
  NavigationHook,
  NavigationOutpostHandler,
  LazyOutpostLoader,
} from './types';
import { NavigationHooks, NavigationOutpostVerdicts, DebugPoints } from './types';
import { __DEV__, DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from './consts';
import { debugPoint, createDefaultLogger, createDefaultDebugHandler } from './helpers';
import { createRegistry, register, unregister, getRegisteredNames } from './navigationRegistry';
import { patrol, toNavigationGuardReturn } from './navigationOutposts';
import type { CitadelRuntimeState } from './devtools/types';

/**
 * Dynamic devtools import for tree-shaking
 * When devtools: false, bundlers eliminate this code entirely
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type DevtoolsModule = typeof import('./devtools');

let devtoolsModule: DevtoolsModule | null = null;
let devtoolsLoadFailed = false;

const loadDevtools = async (): Promise<DevtoolsModule | null> => {
  if (devtoolsLoadFailed) {
    return null;
  }

  if (!devtoolsModule) {
    try {
      devtoolsModule = await import('./devtools');
    } catch {
      devtoolsLoadFailed = true;
      return null;
    }
  }

  return devtoolsModule;
};

/**
 * Creates a navigation citadel for Vue Router
 *
 * @example
 * ```typescript
 * const citadel = createNavigationCitadel(router, {
 *   outposts: [
 *     {
 *       name: 'auth', // scope defaults to 'global'
 *       priority: 10,
 *       handler: async ({ verdicts, to }) => {
 *         if (!isAuthenticated && to.meta.requiresAuth) {
 *           return { name: 'login' };
 *         }
 *         return verdicts.ALLOW;
 *       },
 *     },
 *   ],
 *   onError: (error, ctx) => ({ name: 'error' }),
 * });
 * ```
 */
export const createNavigationCitadel = (
  router: Router,
  options: NavigationCitadelOptions = {},
): NavigationCitadelAPI => {
  const {
    log: optionLog,
    debug: optionDebug,
    devtools = __DEV__,
    defaultPriority = DEFAULT_NAVIGATION_OUTPOST_PRIORITY,
  } = options;
  const logger = options.logger ?? createDefaultLogger();
  const debugHandler = options.debugHandler ?? createDefaultDebugHandler();
  const enableDevtools = devtools && typeof window !== 'undefined';
  const registry = createRegistry();

  /**
   * Resolved options with defaults applied
   */
  const resolvedOptions: NavigationCitadelOptions = {
    ...options,
    debugHandler,
  };

  /**
   * Mutable runtime state for log/debug settings
   * Can be modified via DevTools at runtime
   * Initialized with: localStorage → citadel options → defaults
   */
  const runtimeState: CitadelRuntimeState = {
    log: optionLog ?? __DEV__,
    debug: optionDebug ?? false,
  };

  /**
   * Initialize from localStorage if DevTools enabled (deferred to setupDevtools)
   * For now, use citadel options as initial values
   */

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
   * Helper to check if logging is enabled (log OR debug)
   */
  const isLogEnabled = (): boolean => runtimeState.log || runtimeState.debug;

  /**
   * Factory to create guard handler for beforeEach/beforeResolve
   */
  const createNavigationGuardHandler =
    (hook: NavigationHook) =>
    async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
      const ctx = createContext(to, from, hook);
      const outcome = await patrol(registry, ctx, resolvedOptions, logger, runtimeState);

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
    const ctx = createContext(to, from, NavigationHooks.AFTER_EACH);

    /**
     * afterEach doesn't return a value, but we still patrol
     * Errors are handled by onError or logged here (critical - always)
     */
    try {
      await patrol(registry, ctx, resolvedOptions, logger, runtimeState);
    } catch (error) {
      /**
       * Critical: always log
       */
      logger.error('Error in afterEach outpost:', error);
      debugPoint(DebugPoints.ERROR_CAUGHT, runtimeState.debug, logger, debugHandler);
    }
  });

  cleanupFns.push(removeAfterEach);

  /**
   * Deploy a single outpost
   */
  const deployOne = (opts: NavigationOutpost<NavigationOutpostScope, boolean>): void => {
    const { scope = 'global', name, handler, priority, hooks, timeout, lazy = false } = opts;

    /**
     * Create getHandler wrapper
     */
    let cachedHandler: NavigationOutpostHandler | null = null;
    let loadPromise: Promise<NavigationOutpostHandler> | null = null;

    const getHandler = async (): Promise<NavigationOutpostHandler> => {
      /**
       * Return cached if available
       */
      if (cachedHandler) {
        return cachedHandler;
      }

      /**
       * Eager — cache and return
       */
      if (!lazy) {
        cachedHandler = handler as NavigationOutpostHandler;
        return cachedHandler;
      }

      /**
       * Lazy — load module (retry allowed when loadPromise is null)
       */
      if (!loadPromise) {
        loadPromise = (handler as LazyOutpostLoader)()
          .then((mod) => {
            if (!mod.default || typeof mod.default !== 'function') {
              throw new Error(`Lazy outpost "${name}" must export default handler`);
            }
            cachedHandler = mod.default;
            return cachedHandler;
          })
          .catch((err) => {
            /**
             * Allow retry on next call
             */
            loadPromise = null;
            throw err instanceof Error ? err : new Error(String(err));
          });
      }

      return loadPromise;
    };

    if (isLogEnabled()) {
      logger.info(`Deploying ${scope} outpost: ${name}${lazy ? ' (lazy)' : ''}`);
    }

    register(
      registry,
      scope,
      { name, getHandler, lazy, priority, hooks, timeout },
      defaultPriority,
      logger,
    );

    /**
     * Notify DevTools of change
     */
    if (enableDevtools) {
      void loadDevtools().then((mod) => mod?.notifyDevtoolsRefresh());
    }
  };

  /**
   * Abandon a single outpost
   */
  const abandonOne = (scope: NavigationOutpostScope, name: string): boolean => {
    if (isLogEnabled()) {
      logger.info(`Abandoning ${scope} outpost: ${name}`);
    }

    const result = unregister(registry, scope, name, defaultPriority);

    /**
     * Notify DevTools of change
     */
    if (enableDevtools && result) {
      void loadDevtools().then((mod) => mod?.notifyDevtoolsRefresh());
    }

    return result;
  };

  const findRouteByName = (routeName: string) =>
    router.getRoutes().find((r) => r.name === routeName);

  /**
   * Public API
   */
  const api: NavigationCitadelAPI = {
    install(app: App): void {
      if (!enableDevtools) {
        return;
      }

      void loadDevtools().then((mod) => {
        if (!mod) {
          return;
        }

        mod.setupDevtools(
          app,
          registry,
          logger,
          runtimeState,
          optionLog,
          optionDebug,
          debugHandler,
        );
        debugPoint(DebugPoints.DEVTOOLS_INIT, runtimeState.debug, logger, debugHandler);

        if (isLogEnabled()) {
          logger.info('DevTools initialized via app.use(citadel)');
        }
      });
    },
    deployOutpost(
      opts:
        | NavigationOutpost<NavigationOutpostScope, boolean>
        | NavigationOutpost<NavigationOutpostScope, boolean>[],
    ): void {
      if (Array.isArray(opts)) {
        for (const opt of opts) {
          deployOne(opt);
        }
      } else {
        deployOne(opts);
      }
    },

    abandonOutpost(scope: NavigationOutpostScope, name: string | string[]): boolean {
      if (Array.isArray(name)) {
        let allDeleted = true;

        for (const n of name) {
          if (!abandonOne(scope, n)) {
            allDeleted = false;
          }
        }

        return allDeleted;
      } else {
        return abandonOne(scope, name);
      }
    },

    getOutpostNames(scope: NavigationOutpostScope): string[] {
      return getRegisteredNames(registry, scope);
    },

    assignOutpostToRoute(routeName: string, outpostNames: string | string[]): boolean {
      const route = findRouteByName(routeName);

      if (!route) {
        /**
         * Critical: always log
         */
        logger.warn(`Route "${routeName}" not found`);

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

      if (isLogEnabled()) {
        logger.info(`Assigned outposts [${names.join(', ')}] to route "${routeName}"`);
      }

      return true;
    },

    revokeOutpostFromRoute(routeName: string, outpostNames: string | string[]): boolean {
      const route = findRouteByName(routeName);

      if (!route) {
        /**
         * Critical: always log
         */
        logger.warn(`Route "${routeName}" not found`);

        return false;
      }

      const names = Array.isArray(outpostNames) ? outpostNames : [outpostNames];

      if (!route.meta.outposts) {
        for (const name of names) {
          logger.warn(`Outpost "${name}" not found in route "${routeName}"`);
        }

        return true;
      }

      for (const name of names) {
        if (!route.meta.outposts.includes(name)) {
          logger.warn(`Outpost "${name}" not found in route "${routeName}"`);
        }
      }

      route.meta.outposts = route.meta.outposts.filter((o) => !names.includes(o));

      if (isLogEnabled()) {
        logger.info(`Revoked outposts [${names.join(', ')}] from route "${routeName}"`);
      }

      return true;
    },

    destroy(): void {
      if (isLogEnabled()) {
        logger.info('Destroying citadel');
      }

      for (const cleanup of cleanupFns) {
        cleanup();
      }

      cleanupFns.length = 0;
      registry.global.clear();
      registry.route.clear();
      registry.globalSorted.length = 0;
      registry.routeSorted.length = 0;

      /**
       * Clear DevTools API reference
       */
      if (enableDevtools) {
        void loadDevtools().then((mod) => mod?.clearDevtoolsApi());
      }
    },
  };

  if (options.outposts) {
    api.deployOutpost(options.outposts);
  }

  return api;
};
