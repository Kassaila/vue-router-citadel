import type { RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router';

/**
 * Navigation hooks supported by the citadel
 */
export const NavigationHooks = {
  BEFORE_EACH: 'beforeEach',
  BEFORE_RESOLVE: 'beforeResolve',
  AFTER_EACH: 'afterEach',
} as const;

export type NavigationHook = (typeof NavigationHooks)[keyof typeof NavigationHooks];

/**
 * Navigation outpost verdict constants
 */
export const NavigationOutpostVerdicts = {
  ALLOW: 'allow',
  BLOCK: 'block',
} as const;

export type NavigationOutpostVerdict =
  (typeof NavigationOutpostVerdicts)[keyof typeof NavigationOutpostVerdicts];

/**
 * Navigation outpost scope constants
 */
export const NavigationOutpostScopes = {
  GLOBAL: 'global',
  ROUTE: 'route',
} as const;

export type NavigationOutpostScope =
  (typeof NavigationOutpostScopes)[keyof typeof NavigationOutpostScopes];

// ============================================================================
// Outpost Registries (user-extensible via declaration merging)
// ============================================================================

/**
 * Global outpost registry — extend this interface to enable type-safe global outpost names.
 *
 * @example
 * ```typescript
 * declare module 'vue-router-citadel' {
 *   interface GlobalOutpostRegistry {
 *     'auth': true;
 *     'maintenance': true;
 *   }
 * }
 * ```
 */
export interface GlobalOutpostRegistry {}

/**
 * Route outpost registry — extend this interface to enable type-safe route outpost names.
 *
 * @example
 * ```typescript
 * declare module 'vue-router-citadel' {
 *   interface RouteOutpostRegistry {
 *     'admin-only': true;
 *     'premium': true;
 *   }
 * }
 * ```
 */
export interface RouteOutpostRegistry {}

/**
 * Global outpost name type — inferred from GlobalOutpostRegistry or falls back to string
 */
export type GlobalOutpostName = keyof GlobalOutpostRegistry extends never
  ? string
  : keyof GlobalOutpostRegistry;

/**
 * Route outpost name type — inferred from RouteOutpostRegistry or falls back to string
 */
export type RouteOutpostName = keyof RouteOutpostRegistry extends never
  ? string
  : keyof RouteOutpostRegistry;

/**
 * Combined outpost name type (global | route)
 */
export type OutpostName = GlobalOutpostName | RouteOutpostName;

/**
 * Helper type to get outpost name type by scope
 */
type OutpostNameByScope<S extends NavigationOutpostScope> = S extends 'global'
  ? GlobalOutpostName
  : S extends 'route'
    ? RouteOutpostName
    : never;

/**
 * Debug point names for debugger breakpoints
 */
export const DebugPoints = {
  NAVIGATION_START: 'navigation-start',
  BEFORE_OUTPOST: 'before-outpost',
  PATROL_STOPPED: 'patrol-stopped',
  ERROR_CAUGHT: 'error-caught',
  TIMEOUT: 'timeout',
} as const;

export type DebugPoint = (typeof DebugPoints)[keyof typeof DebugPoints];

/**
 * Logger interface for citadel.
 * Implement this interface to provide custom logging behavior.
 *
 * @example
 * ```typescript
 * // Use with pino for SSR
 * import pino from 'pino';
 * const pinoLogger = pino();
 *
 * const logger: CitadelLogger = {
 *   info: (...args) => pinoLogger.info(args),
 *   warn: (...args) => pinoLogger.warn(args),
 *   error: (...args) => pinoLogger.error(args),
 *   debug: (...args) => pinoLogger.debug(args),
 * };
 * ```
 */
export interface CitadelLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

/**
 * Context passed to navigation outpost functions
 */
export interface NavigationOutpostContext {
  /**
   * Verdict constants for outpost return
   */
  verdicts: typeof NavigationOutpostVerdicts;
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
   * Current hook being processed
   */
  hook: NavigationHook;
}

/**
 * Outcome returned from navigation outpost
 * - NavigationOutpostVerdicts.ALLOW: continue to next outpost
 * - NavigationOutpostVerdicts.BLOCK: cancel navigation
 * - RouteLocationRaw: redirect to specified route
 * - Error: throw error (will be caught by onError handler)
 */
export type NavigationOutpostOutcome = NavigationOutpostVerdict | RouteLocationRaw | Error;

/**
 * Navigation outpost function signature
 */
export type NavigationOutpost = (
  ctx: NavigationOutpostContext,
) => NavigationOutpostOutcome | Promise<NavigationOutpostOutcome>;

/**
 * Navigation outpost registration options.
 * Generic parameter S constrains the name field based on scope.
 */
export interface NavigationOutpostOptions<
  S extends NavigationOutpostScope = NavigationOutpostScope,
> {
  /**
   * Outpost scope
   */
  scope: S;
  /**
   * Unique outpost name (type-safe when registries are extended)
   */
  name: OutpostNameByScope<S>;
  /**
   * Outpost handler function
   */
  handler: NavigationOutpost;
  /**
   * Priority for outposts (lower = processed first). Default: 100
   */
  priority?: number;
  /**
   * Hooks this outpost should run on. Default: ['beforeEach']
   */
  hooks?: NavigationHook[];
  /**
   * Timeout for this outpost in milliseconds. Overrides defaultTimeout.
   */
  timeout?: number;
}

/**
 * Options for creating navigation citadel
 */
export interface NavigationCitadelOptions {
  /**
   * Initial outposts to deploy on citadel creation
   */
  outposts?: NavigationOutpostOptions[];
  /**
   * Enable logging for non-critical events. Default: __DEV__
   * Critical events (errors, timeouts) are always logged regardless of this setting.
   */
  log?: boolean;
  /**
   * Custom logger implementation. Default: createDefaultLogger() (console with emoji prefixes)
   *
   * @example
   * ```typescript
   * createNavigationCitadel(router, {
   *   logger: myCustomLogger,
   * });
   * ```
   */
  logger?: CitadelLogger;
  /**
   * Enable debug mode (logging + debugger breakpoints at key points). Default: false
   */
  debug?: boolean;
  /**
   * Global error handler
   */
  onError?: (
    error: Error,
    ctx: NavigationOutpostContext,
  ) => NavigationOutpostOutcome | Promise<NavigationOutpostOutcome>;
  /**
   * Default priority for outposts. Default: 100
   */
  defaultPriority?: number;
  /**
   * Default timeout for outposts in milliseconds. Default: undefined (no timeout)
   */
  defaultTimeout?: number;
  /**
   * Handler called when outpost times out
   */
  onTimeout?: (
    outpostName: string,
    ctx: NavigationOutpostContext,
  ) => NavigationOutpostOutcome | Promise<NavigationOutpostOutcome>;
}

/**
 * Placed navigation outpost structure
 */
export type RegisteredNavigationOutpost = Omit<NavigationOutpostOptions, 'scope'>;

/**
 * Public API returned by createNavigationCitadel
 */
export interface NavigationCitadelAPI {
  /**
   * Deploy one or multiple outposts
   */
  deployOutpost: <S extends NavigationOutpostScope>(
    options: NavigationOutpostOptions<S> | NavigationOutpostOptions<S>[],
  ) => void;

  /**
   * Remove one or multiple global outposts by name(s)
   */
  abandonOutpost(scope: 'global', name: GlobalOutpostName | GlobalOutpostName[]): boolean;
  /**
   * Remove one or multiple route outposts by name(s)
   */
  abandonOutpost(scope: 'route', name: RouteOutpostName | RouteOutpostName[]): boolean;

  /**
   * Get all deployed global outpost names
   */
  getOutpostNames(scope: 'global'): GlobalOutpostName[];
  /**
   * Get all deployed route outpost names
   */
  getOutpostNames(scope: 'route'): RouteOutpostName[];

  /**
   * Assign route outpost(s) to an existing route by route name
   */
  assignOutpostToRoute: (
    routeName: string,
    outpostNames: RouteOutpostName | RouteOutpostName[],
  ) => boolean;

  /**
   * Destroy the citadel and remove navigation hooks
   */
  destroy: () => void;
}

/**
 * Navigation citadel registry structure
 */
export interface NavigationRegistry {
  /**
   * Global outposts (processed for all routes)
   */
  global: Map<string, RegisteredNavigationOutpost>;
  /**
   * Route outposts (processed when referenced in route meta)
   */
  route: Map<string, RegisteredNavigationOutpost>;
  /**
   * Sorted global outpost names by priority (updated on deploy/abandon)
   */
  globalSorted: string[];
  /**
   * Sorted route outpost names by priority (updated on deploy/abandon)
   */
  routeSorted: string[];
}

/**
 * Extended route meta with navigation outpost support
 */
declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Route outposts to process for this route (type-safe when RouteOutpostRegistry is extended)
     */
    outposts?: RouteOutpostName[];
  }
}
