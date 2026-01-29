import type { RouteLocationNormalized, NavigationGuardReturn } from 'vue-router';
import type {
  NavigationPost,
  NavigationPostContext,
  NavigationCitadelOptions,
  NavigationPostRegistry,
  NavigationPostOutcome,
  NavigationPostRef,
  NavigationHook,
} from './types';
import { NavigationHooks, NavigationPostVerdicts, type NavigationPostVerdict } from './types';
import { DEFAULT_NAVIGATION_POST_PRIORITY } from './consts';

/**
 * Collects all navigation posts to execute for a given route and hook
 * Order: global posts (sorted by priority) -> route posts (parent to child)
 */
export const collectNavigationPosts = (
  registry: NavigationPostRegistry,
  to: RouteLocationNormalized,
  hook: NavigationHook,
  defaultPriority: number = DEFAULT_NAVIGATION_POST_PRIORITY,
): NavigationPost[] => {
  const posts: NavigationPost[] = [];

  /**
   * 1. Collect and sort global posts by priority
   */
  const globalPosts = Array.from(registry.global.values())
    .filter((p) => {
      const hooks = p.hooks ?? [NavigationHooks.BEFORE_EACH];

      return hooks.includes(hook);
    })
    .sort((a, b) => (a.priority ?? defaultPriority) - (b.priority ?? defaultPriority));

  for (const p of globalPosts) {
    posts.push(p.handler);
  }

  /**
   * 2. Collect route posts from matched routes (parent to child)
   */
  for (const matched of to.matched) {
    const routePostRefs = matched.meta?.navigationPosts as NavigationPostRef[] | undefined;

    if (!routePostRefs || !Array.isArray(routePostRefs)) {
      continue;
    }

    for (const ref of routePostRefs) {
      const post = resolveNavigationPost(registry, ref, hook);

      if (post) {
        posts.push(post);
      }
    }
  }

  return posts;
};

/**
 * Resolves a navigation post reference to a post function
 */
const resolveNavigationPost = (
  registry: NavigationPostRegistry,
  ref: NavigationPostRef,
  hook: NavigationHook,
): NavigationPost | null => {
  const placedPost = registry.route.get(ref);

  if (!placedPost) {
    console.warn(`[NavigationCitadel] Route post "${ref}" not found in registry`);

    return null;
  }

  /**
   * Check if post should run on this hook
   */
  const hooks = placedPost.hooks ?? [NavigationHooks.BEFORE_EACH];

  if (!hooks.includes(hook)) {
    return null;
  }

  return placedPost.handler;
};

/**
 * Patrols the navigation citadel by running posts sequentially
 * Stops execution if a post returns BLOCK, redirect, or throws error
 */
export const patrolNavigationCitadel = async (
  posts: NavigationPost[],
  ctx: NavigationPostContext,
  options: NavigationCitadelOptions,
): Promise<NavigationPostOutcome> => {
  const { debug, onError } = options;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];

    if (debug) {
      console.warn(`[NavigationCitadel] Running post ${i + 1}/${posts.length} [${ctx.hook}]`);
    }

    try {
      const outcome = await post(ctx);
      const normalizedOutcome = normalizeNavigationPostVerdict(outcome);

      /**
       * Continue to next post
       */
      if (normalizedOutcome === NavigationPostVerdicts.ALLOW) {
        continue;
      }

      /**
       * Stop patrol and return outcome
       */
      if (debug) {
        console.warn(`[NavigationCitadel] Patrol stopped by post ${i + 1}:`, normalizedOutcome);
      }

      return normalizedOutcome;
    } catch (error) {
      if (debug) {
        console.error(`[NavigationCitadel] Post ${i + 1} threw error:`, error);
      }

      /**
       * Handle error with custom handler or re-throw
       */
      if (onError && error instanceof Error) {
        const errorOutcome = await onError(error, ctx);

        return normalizeNavigationPostVerdict(errorOutcome);
      }

      throw error;
    }
  }

  /**
   * All posts passed
   */
  return NavigationPostVerdicts.ALLOW;
};

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
 * Normalizes navigation post outcome for consistency
 * Throws error if outcome is not a valid verdict or RouteLocationRaw
 */
export const normalizeNavigationPostVerdict = (
  outcome: NavigationPostOutcome,
): NavigationPostOutcome => {
  /**
   * Error - will be handled by caller
   */
  if (outcome instanceof Error) {
    throw outcome;
  }

  /**
   * Valid verdicts
   */
  if (Object.values(NavigationPostVerdicts).includes(outcome as NavigationPostVerdict)) {
    return outcome;
  }

  /**
   * Valid RouteLocationRaw (string path or object with name/path)
   */
  if (isRouteLocationRaw(outcome)) {
    return outcome;
  }

  /**
   * Invalid outcome - throw error
   */
  throw new Error(
    `[NavigationCitadel] Invalid post outcome: ${JSON.stringify(outcome)}. ` +
      `Expected verdicts.ALLOW, verdicts.BLOCK, or RouteLocationRaw (string path or object with name/path).`,
  );
};

/**
 * Converts navigation post outcome to Vue Router navigation guard return type
 */
export const toNavigationGuardReturn = (outcome: NavigationPostOutcome): NavigationGuardReturn => {
  if (outcome === NavigationPostVerdicts.ALLOW) {
    /**
     * Continue navigation
     */
    return true;
  }

  if (outcome === NavigationPostVerdicts.BLOCK) {
    /**
     * Cancel navigation
     */
    return false;
  }

  /**
   * RouteLocationRaw - redirect
   */
  return outcome;
};
