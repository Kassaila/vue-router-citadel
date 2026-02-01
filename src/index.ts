/**
 * Types
 */
export type {
  NavigationOutpostContext,
  NavigationOutpost,
  NavigationOutpostOptions,
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
} from './types';

/**
 * Constants
 */
export { NavigationHooks, NavigationOutpostVerdicts, NavigationOutpostScopes } from './types';

/**
 * Main factory
 */
export { createNavigationCitadel } from './navigationCitadel';
