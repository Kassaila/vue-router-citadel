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
} from './types';

/**
 * Constants
 */
export { NavigationHooks, NavigationOutpostVerdicts, NavigationOutpostScopes } from './types';
export { DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from './consts';

/**
 * Main factory
 */
export { createNavigationCitadel } from './navigationCitadel';
