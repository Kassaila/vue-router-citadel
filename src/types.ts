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
   * Current hook being executed
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
 * Navigation outpost registration options
 */
export interface NavigationOutpostOptions {
  /**
   * Outpost scope
   */
  scope: NavigationOutpostScope;
  /**
   * Unique outpost name
   */
  name: string;
  /**
   * Outpost handler function
   */
  handler: NavigationOutpost;
  /**
   * Priority for outposts (lower = earlier execution). Default: 100
   */
  priority?: number;
  /**
   * Hooks this outpost should run on. Default: ['beforeEach']
   */
  hooks?: NavigationHook[];
}

/**
 * Navigation outpost reference (registered outpost name)
 */
export type NavigationOutpostRef = NavigationOutpostOptions['name'];

/**
 * Options for creating navigation citadel
 */
export interface NavigationCitadelOptions {
  /**
   * Enable console logging (console.info for navigation flow). Default: true
   */
  log?: boolean;
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
}

/**
 * Placed navigation outpost structure
 */
export type PlacedNavigationOutpost = Omit<NavigationOutpostOptions, 'scope'>;

/**
 * Public API returned by createNavigationCitadel
 */
export interface NavigationCitadelAPI {
  /**
   * Register one or multiple outposts
   */
  deploy: (options: NavigationOutpostOptions | NavigationOutpostOptions[]) => void;
  /**
   * Remove one or multiple outposts by scope and name(s)
   */
  abandon: (scope: NavigationOutpostScope, name: string | string[]) => boolean;
  /**
   * Get all registered outpost names by scope
   */
  getOutposts: (scope: NavigationOutpostScope) => string[];
  /**
   * Assign outpost(s) to an existing route by route name
   */
  assignOutpostToRoute: (routeName: string, outpostNames: string | string[]) => boolean;
  /**
   * Destroy the citadel and remove navigation hooks
   */
  destroy: () => void;
}

/**
 * Navigation citadel registry structure
 */
export interface NavigationOutpostRegistry {
  /**
   * Global outposts (executed for all routes)
   */
  global: Map<string, PlacedNavigationOutpost>;
  /**
   * Route outposts (executed when referenced in route meta)
   */
  route: Map<string, PlacedNavigationOutpost>;
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
     * Navigation outposts to execute for this route
     */
    outposts?: NavigationOutpostRef[];
  }
}
