import type { NavigationGuardReturn, Router } from 'vue-router';

import type {
  NavigationOutpostContext,
  NavigationCitadelOptions,
  NavigationOutpostRegistry,
  NavigationOutpostOutcome,
  PlacedNavigationOutpost,
} from './types';
import { NavigationHooks, NavigationOutpostVerdicts, type NavigationOutpostVerdict } from './types';
import { LOG_PREFIX } from './consts';

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
export const normalizeNavigationOutpostVerdict = (
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
const shouldRunOnHook = (outpost: PlacedNavigationOutpost, hook: string): boolean => {
  const hooks = outpost.hooks ?? [NavigationHooks.BEFORE_EACH];

  return hooks.includes(hook as typeof NavigationHooks.BEFORE_EACH);
};

/**
 * Executes a single outpost and returns normalized outcome
 */
const executeOutpost = async (
  outpost: PlacedNavigationOutpost,
  ctx: NavigationOutpostContext,
  options: NavigationCitadelOptions,
): Promise<NavigationOutpostOutcome> => {
  const { log = true, debug = false, onError } = options;
  const enableLog = log || debug;
  const { router } = ctx;

  if (debug) {
    debugger;
  }

  try {
    const outcome = await outpost.handler(ctx);

    return normalizeNavigationOutpostVerdict(outcome, router);
  } catch (error) {
    /**
     * Handle error with custom handler or default behavior
     */
    if (onError && error instanceof Error) {
      const errorOutcome = await onError(error, ctx);

      return normalizeNavigationOutpostVerdict(errorOutcome, router);
    }

    /**
     * Default error handler: log error and block navigation
     */
    console.error(`${LOG_PREFIX} Outpost "${outpost.name}" threw error:`, error);

    if (debug) {
      debugger;
    }

    return NavigationOutpostVerdicts.BLOCK;
  }
};

/**
 * Patrols the navigation citadel by running outposts sequentially
 * Stops execution if an outpost returns BLOCK, redirect, or throws error
 *
 * Execution order:
 * 1. Global outposts (pre-sorted by priority)
 * 2. Route outposts (pre-sorted by priority, deduplicated)
 */
export const patrolNavigationCitadel = async (
  registry: NavigationOutpostRegistry,
  ctx: NavigationOutpostContext,
  options: NavigationCitadelOptions,
): Promise<NavigationOutpostOutcome> => {
  const { log = true, debug = false } = options;
  const enableLog = log || debug;
  const { hook, to } = ctx;

  /**
   * 1. Collect route outpost names from matched routes + check duplicates
   */
  const routeOutpostRefs: string[] = to.matched.flatMap(
    (matched) => (matched.meta?.outposts as string[] | undefined) ?? [],
  );
  const routeOutpostNames = new Set(routeOutpostRefs);

  if (routeOutpostRefs.length !== routeOutpostNames.size) {
    console.warn(
      `${LOG_PREFIX} Duplicate outposts detected on route "${String(to.name ?? to.path)}"`,
    );
  }

  let executedCount = 0;
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
    console.info(`${LOG_PREFIX} Patrolling ${totalCount} outposts for ${hook}`);
  }

  /**
   * 2. Execute global outposts (pre-sorted by priority)
   */
  for (const name of registry.globalSorted) {
    const outpost = registry.global.get(name);

    if (!outpost || !shouldRunOnHook(outpost, hook)) {
      continue;
    }

    executedCount++;

    if (enableLog) {
      console.info(
        `${LOG_PREFIX} Running outpost ${executedCount}/${totalCount}: "${name}" [${hook}]`,
      );
    }

    const outcome = await executeOutpost(outpost, ctx, options);

    if (outcome !== NavigationOutpostVerdicts.ALLOW) {
      if (enableLog) {
        console.warn(`${LOG_PREFIX} Patrol stopped by outpost "${name}":`, outcome);
      }

      if (debug) {
        debugger;
      }

      return outcome;
    }
  }

  /**
   * 3. Execute route outposts (pre-sorted by priority, filtered by needed names)
   */
  for (const name of registry.routeSorted) {
    if (!routeOutpostNames.has(name)) {
      continue;
    }

    const outpost = registry.route.get(name);

    if (!outpost) {
      console.warn(`${LOG_PREFIX} Route outpost "${name}" not found in registry`);
      continue;
    }

    if (!shouldRunOnHook(outpost, hook)) {
      continue;
    }

    executedCount++;

    if (enableLog) {
      console.info(
        `${LOG_PREFIX} Running outpost ${executedCount}/${totalCount}: "${name}" [${hook}]`,
      );
    }

    const outcome = await executeOutpost(outpost, ctx, options);

    if (outcome !== NavigationOutpostVerdicts.ALLOW) {
      if (enableLog) {
        console.warn(`${LOG_PREFIX} Patrol stopped by outpost "${name}":`, outcome);
      }

      if (debug) {
        debugger;
      }

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
