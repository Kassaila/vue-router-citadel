import type { App } from 'vue';
import type { Router, RouteLocationNormalized } from 'vue-router';

import type {
  CitadelLogger,
  NavigationOutpostContext,
  NavigationCitadelAPI,
  NavigationCitadelOptions,
  NavigationOutpost,
  NavigationOutpostScope,
  NavigationHook,
} from './types';
import { NavigationHooks, NavigationOutpostVerdicts, DebugPoints } from './types';
import { __DEV__, DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from './consts';
import { debugPoint, createDefaultLogger } from './helpers';
import { createRegistry, register, unregister, getRegisteredNames } from './navigationRegistry';
import { patrol, toNavigationGuardReturn } from './navigationOutposts';

/**
 * Dynamic devtools import for tree-shaking
 * When devtools: false, bundlers eliminate this code entirely
 */
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
    log = __DEV__,
    debug = false,
    devtools = __DEV__,
    defaultPriority = DEFAULT_NAVIGATION_OUTPOST_PRIORITY,
  } = options;
  const logger = options.logger ?? createDefaultLogger();
  const enableLog = log || debug;
  const enableDevtools = devtools && typeof window !== 'undefined';
  const registry = createRegistry();

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
      const ctx = createContext(to, from, hook);
      const outcome = await patrol(registry, ctx, options, logger, enableLog, debug);

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
      await patrol(registry, ctx, options, logger, enableLog, debug);
    } catch (error) {
      // Critical: always log
      logger.error('Error in afterEach outpost:', error);
      debugPoint(DebugPoints.ERROR_CAUGHT, debug, logger);
    }
  });

  cleanupFns.push(removeAfterEach);

  /**
   * Deploy a single outpost
   */
  const deployOne = (opts: NavigationOutpost<NavigationOutpostScope>): void => {
    const { scope = 'global', name, handler, priority, hooks, timeout } = opts;

    if (enableLog) {
      logger.info(`Deploying ${scope} outpost: ${name}`);
    }

    register(registry, scope, { name, handler, priority, hooks, timeout }, defaultPriority, logger);

    // Notify DevTools of change
    if (enableDevtools) {
      loadDevtools().then((mod) => mod?.notifyDevtoolsRefresh());
    }
  };

  /**
   * Abandon a single outpost
   */
  const abandonOne = (scope: NavigationOutpostScope, name: string): boolean => {
    if (enableLog) {
      logger.info(`Abandoning ${scope} outpost: ${name}`);
    }

    const result = unregister(registry, scope, name, defaultPriority);

    // Notify DevTools of change
    if (enableDevtools && result) {
      loadDevtools().then((mod) => mod?.notifyDevtoolsRefresh());
    }

    return result;
  };

  /**
   * Public API
   */
  const api: NavigationCitadelAPI = {
    install(app: App): void {
      if (!enableDevtools) {
        return;
      }

      loadDevtools().then((mod) => {
        if (!mod) {
          return;
        }

        mod.setupDevtools(app, registry, logger, debug);
        debugPoint(DebugPoints.DEVTOOLS_INIT, debug, logger);

        if (enableLog) {
          logger.info('DevTools initialized via app.use(citadel)');
        }
      });
    },
    deployOutpost(
      opts: NavigationOutpost<NavigationOutpostScope> | NavigationOutpost<NavigationOutpostScope>[],
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
      }

      return abandonOne(scope, name);
    },

    getOutpostNames(scope: NavigationOutpostScope): string[] {
      return getRegisteredNames(registry, scope);
    },

    assignOutpostToRoute(routeName: string, outpostNames: string | string[]): boolean {
      const routes = router.getRoutes();
      const route = routes.find((r) => r.name === routeName);

      if (!route) {
        // Critical: always log
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

      if (enableLog) {
        logger.info(`Assigned outposts [${names.join(', ')}] to route "${routeName}"`);
      }

      return true;
    },

    destroy(): void {
      if (enableLog) {
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

      // Clear DevTools API reference
      if (enableDevtools) {
        loadDevtools().then((mod) => mod?.clearDevtoolsApi());
      }
    },
  };

  if (options.outposts) {
    api.deployOutpost(options.outposts);
  }

  return api;
};
