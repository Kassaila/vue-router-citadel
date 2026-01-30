import type { RouteLocationNormalized, NavigationGuardReturn, Router } from 'vue-router';

import type {
  NavigationOutpost,
  NavigationOutpostContext,
  NavigationCitadelOptions,
  NavigationOutpostRegistry,
  NavigationOutpostOutcome,
  NavigationOutpostRef,
  NavigationHook,
} from './types';
import { NavigationHooks, NavigationOutpostVerdicts, type NavigationOutpostVerdict } from './types';
import { LOG_PREFIX, DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from './consts';

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
 * Resolves a navigation outpost reference to an outpost function
 */
const resolveNavigationOutpost = (
  registry: NavigationOutpostRegistry,
  ref: NavigationOutpostRef,
  hook: NavigationHook,
): NavigationOutpost | null => {
  const placedOutpost = registry.route.get(ref);

  if (!placedOutpost) {
    console.warn(`${LOG_PREFIX} Route outpost "${ref}" not found in registry`);

    return null;
  }

  /**
   * Check if outpost should run on this hook
   */
  const hooks = placedOutpost.hooks ?? [NavigationHooks.BEFORE_EACH];

  if (!hooks.includes(hook)) {
    return null;
  }

  return placedOutpost.handler;
};

/**
 * Collects all navigation outposts to execute for a given route and hook
 * Order: global outposts (sorted by priority) -> route outposts (parent to child)
 */
export const collectNavigationOutposts = (
  registry: NavigationOutpostRegistry,
  to: RouteLocationNormalized,
  hook: NavigationHook,
  defaultPriority: number = DEFAULT_NAVIGATION_OUTPOST_PRIORITY,
): NavigationOutpost[] => {
  const outposts: NavigationOutpost[] = [];

  /**
   * 1. Collect and sort global outposts by priority
   */
  const globalOutposts = Array.from(registry.global.values())
    .filter((p) => {
      const hooks = p.hooks ?? [NavigationHooks.BEFORE_EACH];

      return hooks.includes(hook);
    })
    .sort((a, b) => (a.priority ?? defaultPriority) - (b.priority ?? defaultPriority));

  for (const p of globalOutposts) {
    outposts.push(p.handler);
  }

  /**
   * 2. Collect route outposts from matched routes (parent to child)
   */
  for (const matched of to.matched) {
    const routeOutpostRefs = matched.meta?.outposts as NavigationOutpostRef[] | undefined;

    if (!routeOutpostRefs || !Array.isArray(routeOutpostRefs)) {
      continue;
    }

    for (const ref of routeOutpostRefs) {
      const outpost = resolveNavigationOutpost(registry, ref, hook);

      if (outpost) {
        outposts.push(outpost);
      }
    }
  }

  return outposts;
};

/**
 * Patrols the navigation citadel by running outposts sequentially
 * Stops execution if an outpost returns BLOCK, redirect, or throws error
 */
export const patrolNavigationCitadel = async (
  outposts: NavigationOutpost[],
  ctx: NavigationOutpostContext,
  options: NavigationCitadelOptions,
): Promise<NavigationOutpostOutcome> => {
  const { log = true, debug = false, onError } = options;
  const enableLog = log || debug;
  const { router } = ctx;

  for (let i = 0; i < outposts.length; i++) {
    const outpost = outposts[i];

    if (enableLog) {
      console.info(`${LOG_PREFIX} Running outpost ${i + 1}/${outposts.length} [${ctx.hook}]`);
    }

    if (debug) {
      debugger;
    }

    try {
      const outcome = await outpost(ctx);
      const normalizedOutcome = normalizeNavigationOutpostVerdict(outcome, router);

      /**
       * Continue to next outpost
       */
      if (normalizedOutcome === NavigationOutpostVerdicts.ALLOW) {
        continue;
      }

      /**
       * Stop patrol and return outcome
       */
      if (enableLog) {
        console.warn(`${LOG_PREFIX} Patrol stopped by outpost ${i + 1}:`, normalizedOutcome);
      }

      if (debug) {
        debugger;
      }

      return normalizedOutcome;
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
      console.error(`${LOG_PREFIX} Outpost ${i + 1} threw error:`, error);

      if (debug) {
        debugger;
      }

      return NavigationOutpostVerdicts.BLOCK;
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
