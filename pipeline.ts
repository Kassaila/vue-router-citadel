import type { RouteLocationNormalized, NavigationGuardReturn } from 'vue-router';
import type {
  Middleware,
  MiddlewareContext,
  MiddlewarePipelineOptions,
  MiddlewareRegistry,
  MiddlewareResult,
  RouteMiddlewareRef,
  RouterHookType,
} from './types';
import { RouterHook, MiddlewareAction } from './types';

const DEFAULT_PRIORITY = 100;

/**
 * Collects all middlewares to execute for a given route and hook
 * Order: global middlewares (sorted by priority) -> route middlewares (parent to child)
 */
export const collectMiddlewares = (
  registry: MiddlewareRegistry,
  to: RouteLocationNormalized,
  hook: RouterHookType,
): Middleware[] => {
  const middlewares: Middleware[] = [];

  /**
   * 1. Collect and sort global middlewares by priority
   */
  const globalMiddlewares = Array.from(registry.global.values())
    .filter((m) => {
      const hooks = m.hooks ?? [RouterHook.BEFORE_EACH];

      return hooks.includes(hook);
    })
    .sort((a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY));

  for (const m of globalMiddlewares) {
    middlewares.push(m.handler);
  }

  /**
   * 2. Collect route middlewares from matched routes (parent to child)
   */
  for (const matched of to.matched) {
    const routeMiddlewareRefs = matched.meta?.middleware as RouteMiddlewareRef[] | undefined;

    if (!routeMiddlewareRefs || !Array.isArray(routeMiddlewareRefs)) {
      continue;
    }

    for (const ref of routeMiddlewareRefs) {
      const middleware = resolveMiddleware(registry, ref, hook);

      if (middleware) {
        middlewares.push(middleware);
      }
    }
  }

  return middlewares;
};

/**
 * Resolves a middleware reference to a middleware function
 */
const resolveMiddleware = (
  registry: MiddlewareRegistry,
  ref: RouteMiddlewareRef,
  hook: RouterHookType,
): Middleware | null => {
  /**
   * Inline middleware function
   */
  if (typeof ref === 'function') {
    return ref;
  }

  /**
   * Named middleware reference
   */
  const namedMiddleware = registry.route.get(ref);

  if (!namedMiddleware) {
    console.warn(`[MiddlewarePipeline] Route middleware "${ref}" not found in registry`);

    return null;
  }

  /**
   * Check if middleware should run on this hook
   */
  const hooks = namedMiddleware.hooks ?? [RouterHook.BEFORE_EACH];

  if (!hooks.includes(hook)) {
    return null;
  }

  return namedMiddleware.handler;
};

/**
 * Runs the middleware pipeline sequentially
 * Stops execution if a middleware returns BLOCK, redirect, or throws error
 */
export const runPipeline = async (
  middlewares: Middleware[],
  ctx: MiddlewareContext,
  options: MiddlewarePipelineOptions,
): Promise<MiddlewareResult> => {
  const { debug, onError } = options;

  for (let i = 0; i < middlewares.length; i++) {
    const middleware = middlewares[i];

    if (debug) {
      console.warn(
        `[MiddlewarePipeline] Running middleware ${i + 1}/${middlewares.length} [${ctx.hook}]`,
      );
    }

    try {
      const result = await middleware(ctx);
      const normalizedResult = normalizeResult(result);

      /**
       * Continue to next middleware
       */
      if (normalizedResult === MiddlewareAction.ALLOW || normalizedResult === undefined) {
        continue;
      }

      /**
       * Stop pipeline and return result
       */
      if (debug) {
        console.warn(
          `[MiddlewarePipeline] Pipeline stopped by middleware ${i + 1}:`,
          normalizedResult,
        );
      }

      return normalizedResult;
    } catch (error) {
      if (debug) {
        console.error(`[MiddlewarePipeline] Middleware ${i + 1} threw error:`, error);
      }

      /**
       * Handle error with custom handler or re-throw
       */
      if (onError && error instanceof Error) {
        const errorResult = await onError(error, ctx);

        return normalizeResult(errorResult);
      }

      throw error;
    }
  }

  /**
   * All middlewares passed
   */
  return MiddlewareAction.ALLOW;
};

/**
 * Normalizes middleware result for consistency
 */
export const normalizeResult = (result: MiddlewareResult): MiddlewareResult => {
  /**
   * void/undefined -> ALLOW (continue)
   */
  if (result === undefined || result === null) {
    return MiddlewareAction.ALLOW;
  }

  /**
   * Error - will be handled by caller
   */
  if (result instanceof Error) {
    throw result;
  }

  /**
   * MiddlewareAction or RouteLocationRaw - return as-is
   */
  return result;
};

/**
 * Converts middleware result to Vue Router navigation guard return type
 */
export const toNavigationGuardReturn = (result: MiddlewareResult): NavigationGuardReturn => {
  if (result === MiddlewareAction.ALLOW || result === undefined) {
    /**
     * Continue navigation
     */
    return true;
  }

  if (result === MiddlewareAction.BLOCK) {
    /**
     * Cancel navigation
     */
    return false;
  }

  /**
   * RouteLocationRaw - redirect
   */
  return result;
};
