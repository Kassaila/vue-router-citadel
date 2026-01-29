import type {
  NavigationOutpostRegistry,
  NavigationOutpostScope,
  PlacedNavigationOutpost,
} from './types';

/**
 * Creates a new navigation outpost registry
 */
export const createNavigationOutpostRegistry = (): NavigationOutpostRegistry => ({
  global: new Map(),
  route: new Map(),
});

/**
 * Adds a navigation outpost to the registry
 */
export const addNavigationOutpost = (
  registry: NavigationOutpostRegistry,
  scope: NavigationOutpostScope,
  outpost: PlacedNavigationOutpost,
): void => {
  if (registry[scope].has(outpost.name)) {
    console.warn(
      `[NavigationCitadel] ${scope} outpost "${outpost.name}" already exists, replacing...`,
    );
  }

  registry[scope].set(outpost.name, outpost);
};

/**
 * Removes a navigation outpost from the registry by name
 *
 * @returns true if outpost was found and removed
 */
export const removeNavigationOutpost = (
  registry: NavigationOutpostRegistry,
  scope: NavigationOutpostScope,
  name: string,
): boolean => registry[scope].delete(name);

/**
 * Gets all navigation outpost names by scope
 */
export const getNavigationOutpostNames = (
  registry: NavigationOutpostRegistry,
  scope: NavigationOutpostScope,
): string[] => Array.from(registry[scope].keys());
