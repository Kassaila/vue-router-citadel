import type {
  NavigationRegistry,
  RegisteredNavigationOutpost,
  CitadelLogger,
  NavigationOutpostScope,
} from '../types';
import { NavigationHooks, NavigationOutpostScopes, DebugPoints } from '../types';
import { DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from '../consts';
import { debugPoint } from '../helpers';
import type {
  DevToolsApi,
  CustomInspectorNode,
  CustomInspectorState,
  OutpostTreeNode,
} from './types';
import {
  DEVTOOLS_INSPECTOR_ID,
  DEVTOOLS_PLUGIN_LABEL,
  DEVTOOLS_PLUGIN_ICON,
  INSPECTOR_NODE_ID_ROOT,
  INSPECTOR_NODE_ID_GLOBAL,
  INSPECTOR_NODE_ID_ROUTE,
  TAG_COLOR_TEXT,
  TAG_COLOR_PRIORITY_BG,
  TAG_COLOR_HOOKS_BG,
  TAG_COLOR_SCOPE_GLOBAL_BG,
  TAG_COLOR_SCOPE_ROUTE_BG,
} from './consts';

/**
 * Gets outpost priority with default fallback
 */
const getOutpostPriority = (outpost: RegisteredNavigationOutpost): number =>
  outpost.priority ?? DEFAULT_NAVIGATION_OUTPOST_PRIORITY;

/**
 * Gets outpost hooks with default fallback
 */
const getOutpostHooks = (outpost: RegisteredNavigationOutpost): string[] =>
  outpost.hooks ?? [NavigationHooks.BEFORE_EACH];

/**
 * Creates a tag for priority display
 */
const createPriorityTag = (priority: number) => ({
  label: `priority: ${priority}`,
  textColor: TAG_COLOR_TEXT,
  backgroundColor: TAG_COLOR_PRIORITY_BG,
});

/**
 * Creates a tag for hooks count display
 */
const createHooksTag = (hooks: string[]) => ({
  label: hooks.length === 1 ? hooks[0] : `${hooks.length} hooks`,
  textColor: TAG_COLOR_TEXT,
  backgroundColor: TAG_COLOR_HOOKS_BG,
});

/**
 * Creates tree node for a single outpost
 */
const createOutpostNode = (
  name: string,
  outpost: RegisteredNavigationOutpost,
  scope: NavigationOutpostScope,
): OutpostTreeNode => ({
  id: `outpost-${scope}-${name}`,
  label: name,
  tags: [createPriorityTag(getOutpostPriority(outpost)), createHooksTag(getOutpostHooks(outpost))],
});

/**
 * Creates inspector tree structure from registry
 */
export const createInspectorTree = (registry: NavigationRegistry): CustomInspectorNode[] => {
  const globalOutposts: OutpostTreeNode[] = [];
  const routeOutposts: OutpostTreeNode[] = [];

  // Build global outposts (sorted by priority)
  for (const name of registry.globalSorted) {
    const outpost = registry.global.get(name);
    if (outpost) {
      globalOutposts.push(createOutpostNode(name, outpost, NavigationOutpostScopes.GLOBAL));
    }
  }

  // Build route outposts (sorted by priority)
  for (const name of registry.routeSorted) {
    const outpost = registry.route.get(name);
    if (outpost) {
      routeOutposts.push(createOutpostNode(name, outpost, NavigationOutpostScopes.ROUTE));
    }
  }

  return [
    {
      id: INSPECTOR_NODE_ID_ROOT,
      label: 'Outposts',
      children: [
        {
          id: INSPECTOR_NODE_ID_GLOBAL,
          label: `Global (${globalOutposts.length})`,
          tags: [
            {
              label: NavigationOutpostScopes.GLOBAL,
              textColor: TAG_COLOR_TEXT,
              backgroundColor: TAG_COLOR_SCOPE_GLOBAL_BG,
            },
          ],
          children: globalOutposts,
        },
        {
          id: INSPECTOR_NODE_ID_ROUTE,
          label: `Route (${routeOutposts.length})`,
          tags: [
            {
              label: NavigationOutpostScopes.ROUTE,
              textColor: TAG_COLOR_TEXT,
              backgroundColor: TAG_COLOR_SCOPE_ROUTE_BG,
            },
          ],
          children: routeOutposts,
        },
      ],
    },
  ];
};

/**
 * Gets state data for a selected node
 */
export const getNodeState = (
  nodeId: string,
  registry: NavigationRegistry,
): CustomInspectorState | null => {
  // Check if it's an outpost node
  const outpostMatch = nodeId.match(
    `^outpost-(${NavigationOutpostScopes.GLOBAL}|${NavigationOutpostScopes.ROUTE})-(.+)$`,
  );
  if (!outpostMatch) {
    return null;
  }

  const [, scope, name] = outpostMatch;
  const map = scope === NavigationOutpostScopes.GLOBAL ? registry.global : registry.route;
  const outpost = map.get(name);

  if (!outpost) {
    return null;
  }

  return {
    'Outpost Details': [
      { key: 'name', value: name },
      { key: 'scope', value: scope },
      { key: 'priority', value: getOutpostPriority(outpost) },
      { key: 'hooks', value: getOutpostHooks(outpost) },
      { key: 'timeout', value: outpost.timeout ?? 'none (uses default)' },
    ],
  };
};

/**
 * Sets up the custom inspector for DevTools
 */
export const setupInspector = (
  api: DevToolsApi,
  registry: NavigationRegistry,
  logger: CitadelLogger,
  debug = false,
): void => {
  api.addInspector({
    id: DEVTOOLS_INSPECTOR_ID,
    label: DEVTOOLS_PLUGIN_LABEL,
    icon: DEVTOOLS_PLUGIN_ICON,
  });

  api.on.getInspectorTree((payload) => {
    if (payload.inspectorId !== DEVTOOLS_INSPECTOR_ID) {
      return;
    }
    payload.rootNodes = createInspectorTree(registry);
  });

  api.on.getInspectorState((payload) => {
    if (payload.inspectorId !== DEVTOOLS_INSPECTOR_ID) {
      return;
    }
    const state = getNodeState(payload.nodeId, registry);
    if (state) {
      payload.state = state;
    }
  });

  debugPoint(DebugPoints.DEVTOOLS_INSPECTOR, debug, logger);
};

/**
 * Sends refresh signal to DevTools inspector
 */
export const refreshInspector = (api: DevToolsApi): void => {
  api.sendInspectorTree(DEVTOOLS_INSPECTOR_ID);
  api.sendInspectorState(DEVTOOLS_INSPECTOR_ID);
};
