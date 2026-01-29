import type { RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router';

/**
 * Router hooks supported by the middleware pipeline
 */
export const RouterHook = {
  BEFORE_EACH: 'beforeEach',
  BEFORE_RESOLVE: 'beforeResolve',
  AFTER_EACH: 'afterEach',
} as const;

export type RouterHookType = (typeof RouterHook)[keyof typeof RouterHook];

/**
 * Middleware action constants
 */
export const MiddlewareAction = {
  ALLOW: 'allow',
  BLOCK: 'block',
} as const;

export type MiddlewareActionType = (typeof MiddlewareAction)[keyof typeof MiddlewareAction];

/**
 * Middleware type constants
 */
export const MiddlewareType = {
  GLOBAL: 'global',
  ROUTE: 'route',
} as const;

export type MiddlewareTypeValue = (typeof MiddlewareType)[keyof typeof MiddlewareType];

/**
 * Context passed to middleware functions
 */
export interface MiddlewareContext {
  /**
   * Action constants for middleware return
   */
  action: typeof MiddlewareAction;
  /**
   * Target route
   */
  to: RouteLocationNormalized;
  /**
   * Current route
   */
  from: RouteLocationNormalized;
  /**
   * Router instance
   */
  router: Router;
  /**
   * Current hook being executed
   */
  hook: RouterHookType;
}

/**
 * Result returned from middleware
 * - MiddlewareAction.ALLOW: continue to next middleware
 * - MiddlewareAction.BLOCK: cancel navigation
 * - RouteLocationRaw: redirect to specified route
 * - Error: throw error (will be caught by onError handler)
 */
export type MiddlewareResult = void | MiddlewareActionType | RouteLocationRaw | Error;

/**
 * Middleware function signature
 */
export type Middleware = (ctx: MiddlewareContext) => MiddlewareResult | Promise<MiddlewareResult>;

/**
 * Middleware registration options
 */
export interface MiddlewareOptions {
  /**
   * Middleware type
   */
  type: MiddlewareTypeValue;
  /**
   * Unique middleware name
   */
  name: string;
  /**
   * Middleware handler function
   */
  handler: Middleware;
  /**
   * Priority for global middlewares (lower = earlier execution). Default: 100
   */
  priority?: number;
  /**
   * Hooks this middleware should run on. Default: ['beforeEach']
   */
  hooks?: RouterHookType[];
}

/**
 * Route middleware reference (can be name string or inline middleware)
 */
export type RouteMiddlewareRef = string | Middleware;

/**
 * Options for creating middleware pipeline
 */
export interface MiddlewarePipelineOptions {
  /**
   * Enable debug logging
   */
  debug?: boolean;
  /**
   * Global error handler
   */
  onError?: (error: Error, ctx: MiddlewareContext) => MiddlewareResult | Promise<MiddlewareResult>;
  /**
   * Default priority for global middlewares
   */
  defaultPriority?: number;
}

/**
 * Internal named middleware structure
 */
export interface NamedMiddleware {
  /**
   * Unique middleware name
   */
  name: string;
  /**
   * Middleware handler function
   */
  handler: Middleware;
  /**
   * Priority for global middlewares (lower = earlier execution). Default: 100
   */
  priority?: number;
  /**
   * Hooks this middleware should run on. Default: ['beforeEach']
   */
  hooks?: RouterHookType[];
}

/**
 * Public API returned by createMiddlewarePipeline
 */
export interface MiddlewarePipelineAPI {
  /**
   * Register one or multiple middlewares
   */
  register: (options: MiddlewareOptions | MiddlewareOptions[]) => void;
  /**
   * Remove one or multiple middlewares by type and name(s)
   */
  delete: (type: MiddlewareTypeValue, name: string | string[]) => boolean;
  /**
   * Get all registered middleware names by type
   */
  getMiddlewares: (type: MiddlewareTypeValue) => string[];
  /**
   * Destroy the pipeline and remove router hooks
   */
  destroy: () => void;
}

/**
 * Internal middleware registry structure
 */
export interface MiddlewareRegistry {
  /**
   * Global middlewares (executed for all routes)
   */
  global: Map<string, NamedMiddleware>;
  /**
   * Route middlewares (executed when referenced in route meta)
   */
  route: Map<string, NamedMiddleware>;
}

/**
 * Extended route meta with middleware support
 */
declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Middleware to execute for this route
     */
    middleware?: RouteMiddlewareRef[];
  }
}
