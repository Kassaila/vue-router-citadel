import type {
  NavigationOutpostRegistry,
  NavigationOutpostScope,
  PlacedNavigationOutpost,
} from './types';
import { LOG_PREFIX, DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from './consts';

/**
 * Creates a new navigation outpost registry
 */
export const createNavigationOutpostRegistry = (): NavigationOutpostRegistry => ({
  global: new Map(),
  route: new Map(),
  globalSorted: [],
  routeSorted: [],
});

/**
 * Updates sorted keys array for a scope by priority
 */
export const updateSortedKeys = (
  registry: NavigationOutpostRegistry,
  scope: NavigationOutpostScope,
  defaultPriority: number = DEFAULT_NAVIGATION_OUTPOST_PRIORITY,
): void => {
  const map = registry[scope];
  const sortedKey = `${scope}Sorted` as 'globalSorted' | 'routeSorted';

  registry[sortedKey] = Array.from(map.keys()).sort((a, b) => {
    const priorityA = map.get(a)?.priority ?? defaultPriority;
    const priorityB = map.get(b)?.priority ?? defaultPriority;

    return priorityA - priorityB;
  });
};

/**
 * Adds a navigation outpost to the registry
 */
export const addNavigationOutpost = (
  registry: NavigationOutpostRegistry,
  scope: NavigationOutpostScope,
  outpost: PlacedNavigationOutpost,
  defaultPriority: number = DEFAULT_NAVIGATION_OUTPOST_PRIORITY,
): void => {
  if (registry[scope].has(outpost.name)) {
    console.warn(`${LOG_PREFIX} ${scope} outpost "${outpost.name}" already exists, replacing...`);
  }

  registry[scope].set(outpost.name, outpost);
  updateSortedKeys(registry, scope, defaultPriority);
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
  defaultPriority: number = DEFAULT_NAVIGATION_OUTPOST_PRIORITY,
): boolean => {
  const deleted = registry[scope].delete(name);

  if (deleted) {
    updateSortedKeys(registry, scope, defaultPriority);
  }

  return deleted;
};

/**
 * Gets all navigation outpost names by scope
 */
export const getNavigationOutpostNames = (
  registry: NavigationOutpostRegistry,
  scope: NavigationOutpostScope,
): string[] => Array.from(registry[scope].keys());
