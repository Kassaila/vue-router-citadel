import type {
  CitadelLogger,
  NavigationRegistry,
  NavigationOutpostScope,
  RegisteredNavigationOutpost,
} from './types';

/**
 * Creates a new navigation registry
 */
export const createRegistry = (): NavigationRegistry => ({
  global: new Map(),
  route: new Map(),
  globalSorted: [],
  routeSorted: [],
});

/**
 * Updates sorted keys array for a scope by priority
 */
const updateSortedKeys = (
  registry: NavigationRegistry,
  scope: NavigationOutpostScope,
  defaultPriority: number,
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
 * Registers a navigation outpost in the registry
 */
export const register = (
  registry: NavigationRegistry,
  scope: NavigationOutpostScope,
  outpost: RegisteredNavigationOutpost,
  defaultPriority: number,
  logger: CitadelLogger,
): void => {
  if (registry[scope].has(outpost.name)) {
    logger.warn(`${scope} outpost "${outpost.name}" already exists, replacing...`);
  }

  registry[scope].set(outpost.name, outpost);
  updateSortedKeys(registry, scope, defaultPriority);
};

/**
 * Removes a navigation outpost from the registry by name
 *
 * @returns true if outpost was found and removed
 */
export const unregister = (
  registry: NavigationRegistry,
  scope: NavigationOutpostScope,
  name: string,
  defaultPriority: number,
): boolean => {
  const deleted = registry[scope].delete(name);

  if (deleted) {
    updateSortedKeys(registry, scope, defaultPriority);
  }

  return deleted;
};

/**
 * Gets all registered outpost names by scope
 */
export const getRegisteredNames = (
  registry: NavigationRegistry,
  scope: NavigationOutpostScope,
): string[] => Array.from(registry[scope].keys());
