import type { NavigationGuardReturn, Router } from 'vue-router';

import type {
  CitadelLogger,
  NavigationOutpostContext,
  NavigationCitadelOptions,
  NavigationRegistry,
  NavigationOutpostOutcome,
  RegisteredNavigationOutpost,
} from './types';
import {
  NavigationHooks,
  NavigationOutpostVerdicts,
  DebugPoints,
  type NavigationOutpostVerdict,
} from './types';
import { LOG_PREFIX } from './consts';
import { debugPoint } from './helpers';

/**
 * Checks if value is a valid RouteLocationRaw
 */
const isRouteLocationRaw = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return true;
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    return 'name' in obj || 'path' in obj;
  }

  return false;
};

/**
 * Normalizes navigation outpost outcome for consistency
 * Throws error if outcome is not a valid verdict or RouteLocationRaw
 */
export const normalizeOutcome = (
  outcome: NavigationOutpostOutcome,
  router: Router,
): NavigationOutpostOutcome => {
  /**
   * Error - will be handled by caller
   */
  if (outcome instanceof Error) {
    throw outcome;
  }

  /**
   * Valid verdicts
   */
  if (Object.values(NavigationOutpostVerdicts).includes(outcome as NavigationOutpostVerdict)) {
    return outcome;
  }

  const commonErrorText = `${LOG_PREFIX} Invalid outpost outcome: ${JSON.stringify(outcome)}.`;

  /**
   * Valid RouteLocationRaw (string path or object with name/path)
   */
  if (isRouteLocationRaw(outcome)) {
    const resolved = router.resolve(outcome);

    if (resolved.matched.length === 0) {
      throw new Error(commonErrorText + ` Route not found: ${JSON.stringify(outcome)}`);
    }

    return outcome;
  }

  /**
   * Invalid outcome - throw error
   */
  throw new Error(
    commonErrorText +
      ` Expected: verdicts.ALLOW, verdicts.BLOCK, or RouteLocationRaw (string path or object with name/path).`,
  );
};

/**
 * Checks if outpost should run on the given hook
 */
const shouldRunOnHook = (outpost: RegisteredNavigationOutpost, hook: string): boolean => {
  const hooks = outpost.hooks ?? [NavigationHooks.BEFORE_EACH];

  return hooks.includes(hook as typeof NavigationHooks.BEFORE_EACH);
};

/**
 * Symbol to identify timeout errors
 */
const TIMEOUT_SYMBOL = Symbol('timeout');

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
const createTimeoutPromise = (ms: number): Promise<never> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(`Timeout after ${ms}ms`);

      (error as Error & { [TIMEOUT_SYMBOL]: boolean })[TIMEOUT_SYMBOL] = true;

      reject(error);
    }, ms);
  });

/**
 * Checks if error is a timeout error
 */
const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && TIMEOUT_SYMBOL in error;

/**
 * Processes a single outpost and returns normalized outcome
 */
const processOutpost = async (
  outpost: RegisteredNavigationOutpost,
  ctx: NavigationOutpostContext,
  options: NavigationCitadelOptions,
  logger: CitadelLogger,
): Promise<NavigationOutpostOutcome> => {
  const { debug = false, onError, defaultTimeout, onTimeout } = options;
  const { router } = ctx;
  const timeout = outpost.timeout ?? defaultTimeout;

  debugPoint(DebugPoints.BEFORE_OUTPOST, debug, logger);

  try {
    /**
     * Run handler with optional timeout
     */
    const outcome = timeout
      ? await Promise.race([outpost.handler(ctx), createTimeoutPromise(timeout)])
      : await outpost.handler(ctx);

    return normalizeOutcome(outcome, router);
  } catch (error) {
    /**
     * Handle timeout
     */
    if (isTimeoutError(error)) {
      // Critical: always log
      logger.warn(`Outpost "${outpost.name}" timed out after ${timeout}ms`);
      debugPoint(DebugPoints.TIMEOUT, debug, logger);

      if (onTimeout) {
        const timeoutOutcome = await onTimeout(outpost.name, ctx);

        return normalizeOutcome(timeoutOutcome, router);
      }

      return NavigationOutpostVerdicts.BLOCK;
    }

    /**
     * Handle error with custom handler or default behavior
     */
    if (onError && error instanceof Error) {
      const errorOutcome = await onError(error, ctx);

      return normalizeOutcome(errorOutcome, router);
    }

    /**
     * Default error handler: log error and block navigation
     * Critical: always log
     */
    logger.error(`Outpost "${outpost.name}" threw error:`, error);
    debugPoint(DebugPoints.ERROR_CAUGHT, debug, logger);

    return NavigationOutpostVerdicts.BLOCK;
  }
};

/**
 * Patrols the navigation citadel by processing outposts sequentially
 * Stops processing if an outpost returns BLOCK, redirect, or throws error
 *
 * Processing order:
 * 1. Global outposts (pre-sorted by priority)
 * 2. Route outposts (pre-sorted by priority, deduplicated)
 */
export const patrol = async (
  registry: NavigationRegistry,
  ctx: NavigationOutpostContext,
  options: NavigationCitadelOptions,
  logger: CitadelLogger,
  enableLog: boolean,
): Promise<NavigationOutpostOutcome> => {
  const { debug = false } = options;
  const { hook, to } = ctx;

  /**
   * 1. Collect route outpost names from matched routes + check duplicates
   */
  const routeOutpostRefs: string[] = to.matched.flatMap(
    (matched) => (matched.meta?.outposts as string[] | undefined) ?? [],
  );
  const routeOutpostNames = new Set(routeOutpostRefs);

  if (routeOutpostRefs.length !== routeOutpostNames.size) {
    // Critical: always log
    logger.warn(`Duplicate outposts detected on route "${String(to.name ?? to.path)}"`);
  }

  let processedCount = 0;
  const totalGlobal = registry.globalSorted.filter((name) =>
    shouldRunOnHook(registry.global.get(name)!, hook),
  ).length;
  const totalRoute = registry.routeSorted.filter(
    (name) => routeOutpostNames.has(name) && shouldRunOnHook(registry.route.get(name)!, hook),
  ).length;
  const totalCount = totalGlobal + totalRoute;

  if (totalCount === 0) {
    return NavigationOutpostVerdicts.ALLOW;
  }

  if (enableLog) {
    logger.info(`Patrolling ${totalCount} outposts for ${hook}`);
  }

  /**
   * 2. Process global outposts (pre-sorted by priority)
   */
  for (const name of registry.globalSorted) {
    const outpost = registry.global.get(name);

    if (!outpost || !shouldRunOnHook(outpost, hook)) {
      continue;
    }

    processedCount++;

    if (enableLog) {
      logger.info(`Processing outpost ${processedCount}/${totalCount}: "${name}" [${hook}]`);
    }

    const outcome = await processOutpost(outpost, ctx, options, logger);

    if (outcome !== NavigationOutpostVerdicts.ALLOW) {
      if (enableLog) {
        logger.warn(`Patrol stopped by outpost "${name}":`, outcome);
      }

      debugPoint(DebugPoints.PATROL_STOPPED, debug, logger);

      return outcome;
    }
  }

  /**
   * 3. Process route outposts (pre-sorted by priority, filtered by needed names)
   */
  for (const name of registry.routeSorted) {
    if (!routeOutpostNames.has(name)) {
      continue;
    }

    const outpost = registry.route.get(name);

    if (!outpost) {
      // Critical: always log
      logger.warn(`Route outpost "${name}" not found in registry`);
      continue;
    }

    if (!shouldRunOnHook(outpost, hook)) {
      continue;
    }

    processedCount++;

    if (enableLog) {
      logger.info(`Processing outpost ${processedCount}/${totalCount}: "${name}" [${hook}]`);
    }

    const outcome = await processOutpost(outpost, ctx, options, logger);

    if (outcome !== NavigationOutpostVerdicts.ALLOW) {
      if (enableLog) {
        logger.warn(`Patrol stopped by outpost "${name}":`, outcome);
      }

      debugPoint(DebugPoints.PATROL_STOPPED, debug, logger);

      return outcome;
    }
  }

  /**
   * All outposts passed
   */
  return NavigationOutpostVerdicts.ALLOW;
};

/**
 * Converts navigation outpost outcome to Vue Router navigation guard return type
 */
export const toNavigationGuardReturn = (
  outcome: NavigationOutpostOutcome,
): NavigationGuardReturn => {
  switch (outcome) {
    case NavigationOutpostVerdicts.ALLOW: {
      /**
       * Continue navigation
       */
      return true;
    }
    case NavigationOutpostVerdicts.BLOCK: {
      /**
       * Cancel navigation
       */
      return false;
    }
    default: {
      /**
       * RouteLocationRaw - redirect
       */
      return outcome;
    }
  }
};
