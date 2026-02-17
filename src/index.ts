/**
 * Types
 */
export type {
  NavigationOutpostContext,
  NavigationOutpostHandler,
  NavigationOutpost,
  NavigationCitadelOptions,
  NavigationCitadelAPI,
  NavigationHook,
  NavigationOutpostScope,
  /**
   * Type-safe outpost names (user-extensible via declaration merging)
   */
  GlobalOutpostRegistry,
  RouteOutpostRegistry,
  GlobalOutpostName,
  RouteOutpostName,
  OutpostName,
  /**
   * Logger
   */
  CitadelLogger,
  /**
   * Debug
   */
  DebugHandler,
  DebugPoint,
  /**
   * Lazy loading
   */
  LazyOutpostLoader,
} from './types';

/**
 * Constants
 */
export {
  NavigationHooks,
  NavigationOutpostVerdicts,
  NavigationOutpostScopes,
  DebugPoints,
} from './types';

/**
 * Logger and debug utilities
 */
export { createDefaultLogger, createDefaultDebugHandler } from './helpers';

/**
 * Main factory
 */
export { createNavigationCitadel } from './navigationCitadel';
