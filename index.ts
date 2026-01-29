/**
 * Types
 */
export type {
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareActionType,
  Middleware,
  MiddlewareOptions,
  NamedMiddleware,
  RouteMiddlewareRef,
  MiddlewarePipelineOptions,
  MiddlewarePipelineAPI,
  MiddlewareRegistry,
  RouterHookType,
  MiddlewareTypeValue,
} from './types';

export { RouterHook, MiddlewareAction, MiddlewareType } from './types';

/**
 * Main factory
 */
export { createMiddlewarePipeline } from './createMiddlewarePipeline';

/**
 * Pipeline utilities
 */
export { collectMiddlewares, runPipeline, normalizeResult, toNavigationGuardReturn } from './pipeline';

/**
 * Registry utilities
 */
export {
  createMiddlewareRegistry,
  addGlobalMiddleware,
  removeGlobalMiddleware,
  addRouteMiddleware,
  removeRouteMiddleware,
  getGlobalMiddlewareNames,
  getRouteMiddlewareNames,
} from './registry';
