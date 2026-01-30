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
 * Debug point names for debugger breakpoints
 */
export const DebugPoints = {
  NAVIGATION_START: 'navigation-start',
  BEFORE_OUTPOST: 'before-outpost',
  PATROL_STOPPED: 'patrol-stopped',
  ERROR_CAUGHT: 'error-caught',
} as const;

export type DebugPoint = (typeof DebugPoints)[keyof typeof DebugPoints];

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
   * Priority for outposts (lower = processed first). Default: 100
   */
  priority?: number;
  /**
   * Hooks this outpost should run on. Default: ['beforeEach']
   */
  hooks?: NavigationHook[];
}

/**
 * Navigation outpost reference (deployed outpost name)
 */
export type NavigationOutpostRef = NavigationOutpostOptions['name'];

/**
 * Options for creating navigation citadel
 */
export interface NavigationCitadelOptions {
  /**
   * Enable console logging (console.info for navigation flow). Default: __DEV__
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
   * Deploy one or multiple outposts
   */
  deployOutpost: (options: NavigationOutpostOptions | NavigationOutpostOptions[]) => void;
  /**
   * Remove one or multiple outposts by scope and name(s)
   */
  abandonOutpost: (scope: NavigationOutpostScope, name: string | string[]) => boolean;
  /**
   * Get all deployed outpost names by scope
   */
  getOutpostNames: (scope: NavigationOutpostScope) => string[];
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
   * Global outposts (processed for all routes)
   */
  global: Map<string, PlacedNavigationOutpost>;
  /**
   * Route outposts (processed when referenced in route meta)
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
     * Navigation outposts to process for this route
     */
    outposts?: NavigationOutpostRef[];
  }
}
