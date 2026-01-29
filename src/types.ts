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
 * Navigation post verdict constants
 */
export const NavigationPostVerdicts = {
  ALLOW: 'allow',
  BLOCK: 'block',
} as const;

export type NavigationPostVerdict =
  (typeof NavigationPostVerdicts)[keyof typeof NavigationPostVerdicts];

/**
 * Navigation post scope constants
 */
export const NavigationPostScopes = {
  GLOBAL: 'global',
  ROUTE: 'route',
} as const;

export type NavigationPostScope = (typeof NavigationPostScopes)[keyof typeof NavigationPostScopes];

/**
 * Context passed to navigation post functions
 */
export interface NavigationPostContext {
  /**
   * Verdict constants for post return
   */
  verdicts: typeof NavigationPostVerdicts;
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
 * Outcome returned from navigation post
 * - NavigationPostVerdicts.ALLOW: continue to next post
 * - NavigationPostVerdicts.BLOCK: cancel navigation
 * - RouteLocationRaw: redirect to specified route
 * - Error: throw error (will be caught by onError handler)
 */
export type NavigationPostOutcome = NavigationPostVerdict | RouteLocationRaw | Error;

/**
 * Navigation post function signature
 */
export type NavigationPost = (
  ctx: NavigationPostContext,
) => NavigationPostOutcome | Promise<NavigationPostOutcome>;

/**
 * Navigation post registration options
 */
export interface NavigationPostOptions {
  /**
   * Post scope
   */
  scope: NavigationPostScope;
  /**
   * Unique post name
   */
  name: string;
  /**
   * Post handler function
   */
  handler: NavigationPost;
  /**
   * Priority for global posts (lower = earlier execution). Default: 100
   */
  priority?: number;
  /**
   * Hooks this post should run on. Default: ['beforeEach']
   */
  hooks?: NavigationHook[];
}

/**
 * Navigation post reference (registered post name)
 */
export type NavigationPostRef = NavigationPostOptions['name'];

/**
 * Options for creating navigation citadel
 */
export interface NavigationCitadelOptions {
  /**
   * Enable debug logging
   */
  debug?: boolean;
  /**
   * Global error handler
   */
  onError?: (
    error: Error,
    ctx: NavigationPostContext,
  ) => NavigationPostOutcome | Promise<NavigationPostOutcome>;
  /**
   * Default priority for global posts
   */
  defaultPriority?: number;
}

/**
 * Placed navigation post structure
 */
export type PlacedNavigationPost = Omit<NavigationPostOptions, 'scope'>;

/**
 * Public API returned by createNavigationCitadel
 */
export interface NavigationCitadelAPI {
  /**
   * Register one or multiple posts
   */
  register: (options: NavigationPostOptions | NavigationPostOptions[]) => void;
  /**
   * Remove one or multiple posts by scope and name(s)
   */
  delete: (scope: NavigationPostScope, name: string | string[]) => boolean;
  /**
   * Get all registered post names by scope
   */
  getPosts: (scope: NavigationPostScope) => string[];
  /**
   * Destroy the citadel and remove router hooks
   */
  destroy: () => void;
}

/**
 * Navigation citadel registry structure
 */
export interface NavigationPostRegistry {
  /**
   * Global posts (executed for all routes)
   */
  global: Map<string, PlacedNavigationPost>;
  /**
   * Route posts (executed when referenced in route meta)
   */
  route: Map<string, PlacedNavigationPost>;
}

/**
 * Extended route meta with navigation post support
 */
declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Navigation posts to execute for this route
     */
    navigationPosts?: NavigationPostRef[];
  }
}
