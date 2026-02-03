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
  // Type-safe outpost names (user-extensible via declaration merging)
  GlobalOutpostRegistry,
  RouteOutpostRegistry,
  GlobalOutpostName,
  RouteOutpostName,
  OutpostName,
  // Logger
  CitadelLogger,
  // Lazy loading
  LazyOutpostLoader,
} from './types';

/**
 * Constants
 */
export { NavigationHooks, NavigationOutpostVerdicts, NavigationOutpostScopes } from './types';

/**
 * Logger utilities
 */
export { createDefaultLogger } from './helpers';

/**
 * Main factory
 */
export { createNavigationCitadel } from './navigationCitadel';
