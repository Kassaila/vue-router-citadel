import type {
  NavigationPostRegistry,
  NavigationPostScope,
  PlacedNavigationPost,
} from './types';

/**
 * Creates a new navigation post registry
 */
export const createNavigationPostRegistry = (): NavigationPostRegistry => ({
  global: new Map(),
  route: new Map(),
});

/**
 * Adds a navigation post to the registry
 */
export const addNavigationPost = (
  registry: NavigationPostRegistry,
  scope: NavigationPostScope,
  post: PlacedNavigationPost,
): void => {
  if (registry[scope].has(post.name)) {
    console.warn(`[NavigationCitadel] ${scope} post "${post.name}" already exists, replacing...`);
  }

  registry[scope].set(post.name, post);
};

/**
 * Removes a navigation post from the registry by name
 *
 * @returns true if post was found and removed
 */
export const removeNavigationPost = (
  registry: NavigationPostRegistry,
  scope: NavigationPostScope,
  name: string,
): boolean => registry[scope].delete(name);

/**
 * Gets all navigation post names by scope
 */
export const getNavigationPostNames = (
  registry: NavigationPostRegistry,
  scope: NavigationPostScope,
): string[] => Array.from(registry[scope].keys());
