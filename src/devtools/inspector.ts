import type { Router, RouteRecordNormalized } from 'vue-router';

import type {
  NavigationRegistry,
  RegisteredNavigationOutpost,
  CitadelLogger,
  NavigationOutpostScope,
  DebugHandler,
} from '../types';
import { NavigationHooks, NavigationOutpostScopes, DebugPoints } from '../types';
import { DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from '../consts';
import { debugPoint } from '../helpers';
import type {
  DevToolsApi,
  CustomInspectorNode,
  CustomInspectorState,
  InspectorNodeTag,
  OutpostTreeNode,
} from './types';
import {
  DEVTOOLS_INSPECTOR_ID,
  DEVTOOLS_PLUGIN_LABEL,
  DEVTOOLS_PLUGIN_ICON,
  INSPECTOR_NODE_ID_ROOT,
  INSPECTOR_NODE_ID_GLOBAL,
  INSPECTOR_NODE_ID_ROUTE,
  INSPECTOR_NODE_ID_ROUTE_ASSIGNMENTS,
  INSPECTOR_NODE_ID_CURRENT_ROUTE,
  TAG_COLOR_TEXT,
  TAG_COLOR_PRIORITY_BG,
  TAG_COLOR_HOOKS_BG,
  TAG_COLOR_SCOPE_GLOBAL_BG,
  TAG_COLOR_SCOPE_ROUTE_BG,
  TAG_COLOR_LAZY_BG,
  TAG_COLOR_CURRENT_ROUTE_BG,
} from './consts';

const tag = (label: string, backgroundColor: number) => ({
  label,
  textColor: TAG_COLOR_TEXT,
  backgroundColor,
});

const scopeColor = (scope: NavigationOutpostScope) =>
  scope === NavigationOutpostScopes.GLOBAL ? TAG_COLOR_SCOPE_GLOBAL_BG : TAG_COLOR_SCOPE_ROUTE_BG;

/**
 * Creates tree node for an outpost
 */
const createOutpostNode = (
  idPrefix: string,
  name: string,
  outpost: RegisteredNavigationOutpost,
  scope: NavigationOutpostScope,
  tags: InspectorNodeTag[],
): OutpostTreeNode => {
  if (outpost.lazy) {
    tags.push(tag('lazy', TAG_COLOR_LAZY_BG));
  }

  return { id: `${idPrefix}-${scope}-${name}`, label: name, tags };
};

/**
 * Builds outpost nodes from a registry map + sorted list
 */
const buildOutpostNodes = (
  sorted: string[],
  map: Map<string, RegisteredNavigationOutpost>,
  scope: NavigationOutpostScope,
  idPrefix: string,
  tagsFn: (outpost: RegisteredNavigationOutpost) => InspectorNodeTag[],
): OutpostTreeNode[] => {
  const nodes: OutpostTreeNode[] = [];

  for (const name of sorted) {
    const outpost = map.get(name);
    if (outpost) {
      nodes.push(createOutpostNode(idPrefix, name, outpost, scope, tagsFn(outpost)));
    }
  }

  return nodes;
};

/**
 * Standard tags for Outposts section: priority + hooks
 */
const outpostSectionTags = (outpost: RegisteredNavigationOutpost) => {
  const hooks = outpost.hooks ?? [NavigationHooks.BEFORE_EACH];
  const priority = outpost.priority ?? DEFAULT_NAVIGATION_OUTPOST_PRIORITY;

  return [
    tag(`priority: ${priority}`, TAG_COLOR_PRIORITY_BG),
    tag(hooks.length === 1 ? hooks[0] : `${hooks.length} hooks`, TAG_COLOR_HOOKS_BG),
  ];
};

/**
 * Standard tags for Current Route section: scope + priority
 */
const currentRouteSectionTags =
  (scope: NavigationOutpostScope) => (outpost: RegisteredNavigationOutpost) => {
    const priority = outpost.priority ?? DEFAULT_NAVIGATION_OUTPOST_PRIORITY;

    return [tag(scope, scopeColor(scope)), tag(`priority: ${priority}`, TAG_COLOR_PRIORITY_BG)];
  };

/**
 * Gets route display label (name or path)
 */
const getRouteLabel = (route: RouteRecordNormalized): string =>
  route.name ? String(route.name) : route.path;

/**
 * Collects all outpost names from the matched chain (parent → child),
 * same as patrol() does during navigation
 */
const resolveRouteOutposts = (route: RouteRecordNormalized, router: Router): string[] => {
  if (!route.name && !route.path) {
    return route.meta.outposts ?? [];
  }

  try {
    const resolved = route.name ? router.resolve({ name: route.name }) : router.resolve(route.path);

    return resolved.matched.flatMap((matched) => matched.meta?.outposts ?? []);
  } catch {
    return route.meta.outposts ?? [];
  }
};

/**
 * Creates Route Assignments root node
 * Shows routes with outposts (own or inherited from parent)
 */
export const createRouteAssignmentsNode = (router: Router): CustomInspectorNode => {
  const children: OutpostTreeNode[] = [];

  for (const route of router.getRoutes()) {
    const allOutposts = resolveRouteOutposts(route, router);

    if (allOutposts.length === 0) {
      continue;
    }

    const ownOutposts = route.meta.outposts ?? [];
    const inheritedCount = allOutposts.filter((name) => !ownOutposts.includes(name)).length;

    const tags = [
      tag(
        `${allOutposts.length} outpost${allOutposts.length === 1 ? '' : 's'}`,
        TAG_COLOR_SCOPE_ROUTE_BG,
      ),
    ];

    if (inheritedCount > 0) {
      tags.push(tag(`${inheritedCount} inherited`, TAG_COLOR_SCOPE_GLOBAL_BG));
    }

    children.push({
      id: `route-assignment-${getRouteLabel(route)}`,
      label: getRouteLabel(route),
      tags,
    });
  }

  return {
    id: INSPECTOR_NODE_ID_ROUTE_ASSIGNMENTS,
    label: `Route Assignments (${children.length})`,
    children,
  };
};

/**
 * Creates Current Route root node
 * Shows outposts in execution order: all global (by priority), then route (by priority)
 * Matches patrol() processing order
 */
export const createCurrentRouteNode = (
  registry: NavigationRegistry,
  router: Router,
): CustomInspectorNode => {
  const currentRoute = router.currentRoute.value;

  const globalNodes = buildOutpostNodes(
    registry.globalSorted,
    registry.global,
    NavigationOutpostScopes.GLOBAL,
    'current-route-outpost',
    currentRouteSectionTags(NavigationOutpostScopes.GLOBAL),
  );

  const routeOutpostNames = new Set(
    currentRoute.matched.flatMap((matched) => matched.meta?.outposts ?? []),
  );

  const routeNodes = buildOutpostNodes(
    registry.routeSorted.filter((name) => routeOutpostNames.has(name)),
    registry.route,
    NavigationOutpostScopes.ROUTE,
    'current-route-outpost',
    currentRouteSectionTags(NavigationOutpostScopes.ROUTE),
  );

  const children = [...globalNodes, ...routeNodes];

  return {
    id: INSPECTOR_NODE_ID_CURRENT_ROUTE,
    label: `Current Route: ${currentRoute.path} (${children.length})`,
    tags: [tag('active', TAG_COLOR_CURRENT_ROUTE_BG)],
    children,
  };
};

/**
 * Creates inspector tree structure from registry
 */
export const createInspectorTree = (
  registry: NavigationRegistry,
  router?: Router,
): CustomInspectorNode[] => {
  const globalOutposts = buildOutpostNodes(
    registry.globalSorted,
    registry.global,
    NavigationOutpostScopes.GLOBAL,
    'outpost',
    outpostSectionTags,
  );

  const routeOutposts = buildOutpostNodes(
    registry.routeSorted,
    registry.route,
    NavigationOutpostScopes.ROUTE,
    'outpost',
    outpostSectionTags,
  );

  const nodes: CustomInspectorNode[] = [
    {
      id: INSPECTOR_NODE_ID_ROOT,
      label: 'Outposts',
      children: [
        {
          id: INSPECTOR_NODE_ID_GLOBAL,
          label: `Global (${globalOutposts.length})`,
          tags: [tag(NavigationOutpostScopes.GLOBAL, TAG_COLOR_SCOPE_GLOBAL_BG)],
          children: globalOutposts,
        },
        {
          id: INSPECTOR_NODE_ID_ROUTE,
          label: `Route (${routeOutposts.length})`,
          tags: [tag(NavigationOutpostScopes.ROUTE, TAG_COLOR_SCOPE_ROUTE_BG)],
          children: routeOutposts,
        },
      ],
    },
  ];

  if (router) {
    nodes.push(createRouteAssignmentsNode(router));
    nodes.push(createCurrentRouteNode(registry, router));
  }

  return nodes;
};

/**
 * Builds "Outpost Details" state from a registered outpost
 */
const createOutpostDetailsState = (
  name: string,
  scope: string,
  outpost: RegisteredNavigationOutpost,
): CustomInspectorState => ({
  'Outpost Details': [
    { key: 'name', value: name },
    { key: 'scope', value: scope },
    { key: 'priority', value: outpost.priority ?? DEFAULT_NAVIGATION_OUTPOST_PRIORITY },
    { key: 'hooks', value: outpost.hooks ?? [NavigationHooks.BEFORE_EACH] },
    { key: 'timeout', value: outpost.timeout ?? 'none (uses default)' },
    { key: 'lazy', value: outpost.lazy },
  ],
});

/**
 * Regex for route assignment node IDs
 */
const ROUTE_ASSIGNMENT_NODE_REGEX = /^route-assignment-(.+)$/;

/**
 * Regex for outpost node IDs (both "outpost-" and "current-route-outpost-" prefixes)
 */
const OUTPOST_NODE_REGEX = new RegExp(
  `^(?:outpost|current-route-outpost)-(${NavigationOutpostScopes.GLOBAL}|${NavigationOutpostScopes.ROUTE})-(.+)$`,
);

/**
 * Builds "Route Details" state from a route record
 */
const createRouteDetailsState = (
  route: RouteRecordNormalized,
  router: Router,
): CustomInspectorState => {
  const allOutposts = resolveRouteOutposts(route, router);
  const ownOutposts = route.meta.outposts ?? [];
  const inheritedOutposts = allOutposts.filter((name) => !ownOutposts.includes(name));

  return {
    'Route Details': [
      { key: 'name', value: route.name ? String(route.name) : 'unnamed' },
      { key: 'path', value: route.path },
      { key: 'outposts (own)', value: ownOutposts },
      ...(inheritedOutposts.length > 0
        ? [{ key: 'outposts (inherited)', value: inheritedOutposts }]
        : []),
      { key: 'outposts (resolved)', value: allOutposts },
    ],
  };
};

/**
 * Gets state data for a selected node
 */
export const getNodeState = (
  nodeId: string,
  registry: NavigationRegistry,
  router?: Router,
): CustomInspectorState | null => {
  /**
   * Outpost nodes (both Outposts section and Current Route section)
   */
  const outpostMatch = nodeId.match(OUTPOST_NODE_REGEX);
  if (outpostMatch) {
    const [, scope, name] = outpostMatch;
    const map = scope === NavigationOutpostScopes.GLOBAL ? registry.global : registry.route;
    const outpost = map.get(name);

    return outpost ? createOutpostDetailsState(name, scope, outpost) : null;
  }

  /**
   * Route assignment nodes
   */
  if (router) {
    const routeMatch = nodeId.match(ROUTE_ASSIGNMENT_NODE_REGEX);
    if (routeMatch) {
      const routeLabel = routeMatch[1];
      const route = router
        .getRoutes()
        .find((r) => (r.name ? String(r.name) === routeLabel : r.path === routeLabel));

      return route ? createRouteDetailsState(route, router) : null;
    }
  }

  return null;
};

/**
 * Sets up the custom inspector for DevTools
 */
export const setupInspector = (
  api: DevToolsApi,
  registry: NavigationRegistry,
  router: Router,
  logger: CitadelLogger,
  debug = false,
  debugHandler?: DebugHandler,
): void => {
  api.addInspector({
    id: DEVTOOLS_INSPECTOR_ID,
    label: DEVTOOLS_PLUGIN_LABEL,
    icon: DEVTOOLS_PLUGIN_ICON,
  });

  api.on.getInspectorTree((payload: { inspectorId: string; rootNodes: CustomInspectorNode[] }) => {
    if (payload.inspectorId !== DEVTOOLS_INSPECTOR_ID) {
      return;
    }
    payload.rootNodes = createInspectorTree(registry, router);
  });

  api.on.getInspectorState(
    (payload: { inspectorId: string; nodeId: string; state: CustomInspectorState | null }) => {
      if (payload.inspectorId !== DEVTOOLS_INSPECTOR_ID) {
        return;
      }
      const state = getNodeState(payload.nodeId, registry, router);
      if (state) {
        payload.state = state;
      }
    },
  );

  /**
   * Refresh inspector on navigation to update Current Route node
   */
  router.afterEach(() => {
    refreshInspector(api);
  });

  debugPoint(DebugPoints.DEVTOOLS_INSPECT, debug, logger, debugHandler);
};

/**
 * Sends refresh signal to DevTools inspector
 */
export const refreshInspector = (api: DevToolsApi): void => {
  api.sendInspectorTree(DEVTOOLS_INSPECTOR_ID);
  api.sendInspectorState(DEVTOOLS_INSPECTOR_ID);
};
