import type { MiddlewareRegistry, NamedMiddleware } from './types';

/**
 * Creates a new middleware registry
 */
export const createMiddlewareRegistry = (): MiddlewareRegistry => ({
  global: new Map(),
  route: new Map(),
});

/**
 * Adds a global middleware to the registry
 */
export const addGlobalMiddleware = (
  registry: MiddlewareRegistry,
  middleware: NamedMiddleware,
): void => {
  if (registry.global.has(middleware.name)) {
    console.warn(
      `[MiddlewarePipeline] Global middleware "${middleware.name}" already exists, replacing...`,
    );
  }

  registry.global.set(middleware.name, middleware);
};

/**
 * Removes a global middleware from the registry by name
 *
 * @returns true if middleware was found and removed
 */
export const removeGlobalMiddleware = (registry: MiddlewareRegistry, name: string): boolean =>
  registry.global.delete(name);

/**
 * Adds a route middleware to the registry
 */
export const addRouteMiddleware = (
  registry: MiddlewareRegistry,
  middleware: NamedMiddleware,
): void => {
  if (registry.route.has(middleware.name)) {
    console.warn(
      `[MiddlewarePipeline] Route middleware "${middleware.name}" already exists, replacing...`,
    );
  }

  registry.route.set(middleware.name, middleware);
};

/**
 * Removes a route middleware from the registry by name
 *
 * @returns true if middleware was found and removed
 */
export const removeRouteMiddleware = (registry: MiddlewareRegistry, name: string): boolean =>
  registry.route.delete(name);

/**
 * Gets all global middleware names
 */
export const getGlobalMiddlewareNames = (registry: MiddlewareRegistry): string[] =>
  Array.from(registry.global.keys());

/**
 * Gets all route middleware names
 */
export const getRouteMiddlewareNames = (registry: MiddlewareRegistry): string[] =>
  Array.from(registry.route.keys());
