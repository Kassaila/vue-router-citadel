/**
 * Types
 */
export type {
  NavigationPostContext,
  NavigationPost,
  NavigationPostOptions,
  NavigationCitadelOptions,
  NavigationCitadelAPI,
  NavigationHook,
  NavigationPostScope,
} from './types';

/**
 * Constants
 */
export { NavigationHooks, NavigationPostVerdicts, NavigationPostScopes } from './types';
export { DEFAULT_NAVIGATION_POST_PRIORITY } from './consts';

/**
 * Main factory
 */
export { createNavigationCitadel } from './navigationCitadel';
