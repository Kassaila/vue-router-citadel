import type { NavigationGuardReturn, Router } from 'vue-router';

import {
  type CitadelLogger,
  type NavigationOutpostContext,
  type NavigationCitadelOptions,
  type NavigationRegistry,
  type NavigationOutpostOutcome,
  type RegisteredNavigationOutpost,
  NavigationHooks,
  NavigationOutpostVerdicts,
  DebugPoints,
  type NavigationHook,
  type NavigationOutpostVerdict,
} from './types';
import type { CitadelRuntimeState } from './devtools/types';
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
const shouldRunOnHook = (outpost: RegisteredNavigationOutpost, hook: NavigationHook): boolean => {
  const hooks = outpost.hooks ?? [NavigationHooks.BEFORE_EACH];

  return hooks.includes(hook);
};

/**
 * Symbol to identify timeout errors
 */
const TIMEOUT_SYMBOL = Symbol('timeout');

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
const createTimeoutPromise = (ms: number): { promise: Promise<never>; cancel: () => void } => {
  let timerId: ReturnType<typeof setTimeout>;

  const promise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      const error = new Error(`Timeout after ${ms}ms`);

      (error as Error & { [TIMEOUT_SYMBOL]: boolean })[TIMEOUT_SYMBOL] = true;

      reject(error);
    }, ms);
  });

  return { promise, cancel: () => clearTimeout(timerId) };
};

/**
 * Races a promise against a timeout, ensuring the timer is always cleaned up
 */
const raceWithTimeout = async <T>(promise: Promise<T> | T, ms: number): Promise<T> => {
  const { promise: timeoutPromise, cancel } = createTimeoutPromise(ms);

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    cancel();
  }
};

/**
 * Checks if error is a timeout error
 */
const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && TIMEOUT_SYMBOL in error;

/**
 * Subset of citadel options consumed by `processOutpost` and `patrol`.
 * Decouples these functions from the full public API surface.
 */
export type ProcessOutpostConfig = Pick<
  NavigationCitadelOptions,
  'defaultTimeout' | 'onError' | 'onTimeout' | 'debugHandler'
>;

/**
 * Coerces a thrown value into an Error instance so user handlers always receive one.
 */
const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value));

/**
 * Processes a single outpost and returns normalized outcome
 */
const processOutpost = async (
  outpost: RegisteredNavigationOutpost,
  ctx: NavigationOutpostContext,
  options: ProcessOutpostConfig,
  logger: CitadelLogger,
  runtimeState: CitadelRuntimeState,
): Promise<NavigationOutpostOutcome> => {
  const { router } = ctx;
  const timeout = outpost.timeout ?? options.defaultTimeout;

  debugPoint(DebugPoints.OUTPOST_ENTER, runtimeState.debug, logger, options.debugHandler);

  /**
   * Wraps a recovery handler so its own throws don't leak past `processOutpost`.
   * `normalizeOutcome` throws are caught here too and fall back to BLOCK.
   */
  const runRecoveryHandler = async (
    invokeHandler: () => Promise<NavigationOutpostOutcome> | NavigationOutpostOutcome,
  ): Promise<NavigationOutpostOutcome> => {
    try {
      return normalizeOutcome(await invokeHandler(), router);
    } catch (handlerError) {
      logger.error(`Recovery handler for "${outpost.name}" threw error:`, handlerError);
      debugPoint(DebugPoints.ERROR_CATCH, runtimeState.debug, logger, options.debugHandler);

      return NavigationOutpostVerdicts.BLOCK;
    }
  };

  try {
    /**
     * 1. Load handler (no timeout — network latency is separate)
     * For eager outposts, returns immediately from cache.
     * For lazy outposts, loads module on first call.
     */
    const handler = await outpost.getHandler();

    /**
     * 2. Execute handler (timeout applies only to execution)
     */
    const outcome = timeout ? await raceWithTimeout(handler(ctx), timeout) : await handler(ctx);

    return normalizeOutcome(outcome, router);
  } catch (error) {
    /**
     * Handle timeout
     */
    if (isTimeoutError(error)) {
      /**
       * Critical: always log
       */
      logger.warn(`Outpost "${outpost.name}" timed out after ${timeout}ms`);
      debugPoint(DebugPoints.OUTPOST_TIMEOUT, runtimeState.debug, logger, options.debugHandler);

      const onTimeout = outpost.onTimeout ?? options.onTimeout;

      if (onTimeout) {
        return runRecoveryHandler(() => onTimeout(outpost.name, ctx));
      }

      return NavigationOutpostVerdicts.BLOCK;
    }

    /**
     * Handle error with custom handler or default behavior.
     * Non-Error throws are coerced so user handlers always receive an Error.
     */
    const onError = outpost.onError ?? options.onError;

    if (onError) {
      const normalizedError = toError(error);

      return runRecoveryHandler(() => onError(normalizedError, ctx));
    }

    /**
     * Default: log and BLOCK.
     * Critical: always log.
     */
    logger.error(`Outpost "${outpost.name}" threw error:`, error);
    debugPoint(DebugPoints.ERROR_CATCH, runtimeState.debug, logger, options.debugHandler);

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
  options: ProcessOutpostConfig,
  logger: CitadelLogger,
  runtimeState: CitadelRuntimeState,
): Promise<NavigationOutpostOutcome> => {
  const { hook, to, from } = ctx;
  const enableLog = runtimeState.log || runtimeState.debug;

  /**
   * 1. Collect route outpost names from matched routes + check duplicates
   */
  const routeOutpostRefs: string[] = to.matched.flatMap((matched) => matched.meta?.outposts ?? []);
  const routeOutpostNames = new Set(routeOutpostRefs);

  if (routeOutpostRefs.length !== routeOutpostNames.size) {
    /**
     * Critical: always log
     */
    logger.warn(`Duplicate outposts detected on route "${String(to.name ?? to.path)}"`);
  }

  let processedCount = 0;
  const totalGlobal = registry.globalSorted.filter((name) => {
    const outpost = registry.global.get(name);

    return outpost && shouldRunOnHook(outpost, hook);
  }).length;
  const totalRoute = registry.routeSorted.filter((name) => {
    const outpost = registry.route.get(name);

    return routeOutpostNames.has(name) && outpost && shouldRunOnHook(outpost, hook);
  }).length;
  const totalCount = totalGlobal + totalRoute;

  if (totalCount === 0) {
    return NavigationOutpostVerdicts.ALLOW;
  }

  if (enableLog) {
    logger.info(`${hook}: ${from.path} -> ${to.path} (${totalCount} outposts)`);
  }

  debugPoint(DebugPoints.NAVIGATION_START, runtimeState.debug, logger, options.debugHandler);

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

    const outcome = await processOutpost(outpost, ctx, options, logger, runtimeState);

    if (outcome !== NavigationOutpostVerdicts.ALLOW) {
      if (enableLog) {
        logger.warn(`Patrol stopped by outpost "${name}":`, outcome);
      }

      debugPoint(DebugPoints.OUTPOST_BLOCK, runtimeState.debug, logger, options.debugHandler);

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
      /**
       * Critical: always log
       */
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

    const outcome = await processOutpost(outpost, ctx, options, logger, runtimeState);

    if (outcome !== NavigationOutpostVerdicts.ALLOW) {
      if (enableLog) {
        logger.warn(`Patrol stopped by outpost "${name}":`, outcome);
      }

      debugPoint(DebugPoints.OUTPOST_BLOCK, runtimeState.debug, logger, options.debugHandler);

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
