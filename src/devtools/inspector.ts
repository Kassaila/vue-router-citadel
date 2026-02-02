import type { NavigationRegistry, RegisteredNavigationOutpost, CitadelLogger } from '../types';
import { NavigationHooks, DebugPoints } from '../types';
import { DEFAULT_NAVIGATION_OUTPOST_PRIORITY } from '../consts';
import { debugPoint } from '../helpers';
import {
  DEVTOOLS_CONFIG,
  INSPECTOR_NODE_IDS,
  type DevToolsApi,
  type CustomInspectorNode,
  type CustomInspectorState,
  type OutpostTreeNode,
} from './types';

/**
 * Tag colors for DevTools inspector
 */
const TAG_COLORS = {
  PRIORITY: {
    text: 0xffffff,
    bg: 0x42b983, // Vue green
  },
  HOOKS: {
    text: 0xffffff,
    bg: 0x3b82f6, // Blue
  },
  SCOPE_GLOBAL: {
    text: 0xffffff,
    bg: 0x8b5cf6, // Purple
  },
  SCOPE_ROUTE: {
    text: 0xffffff,
    bg: 0xf59e0b, // Amber
  },
} as const;

/**
 * Creates a tag for priority display
 */
const createPriorityTag = (priority: number) => ({
  label: `priority: ${priority}`,
  textColor: TAG_COLORS.PRIORITY.text,
  backgroundColor: TAG_COLORS.PRIORITY.bg,
});

/**
 * Creates a tag for hooks count display
 */
const createHooksTag = (hooks: string[]) => ({
  label: hooks.length === 1 ? hooks[0] : `${hooks.length} hooks`,
  textColor: TAG_COLORS.HOOKS.text,
  backgroundColor: TAG_COLORS.HOOKS.bg,
});

/**
 * Creates tree node for a single outpost
 */
const createOutpostNode = (
  name: string,
  outpost: RegisteredNavigationOutpost,
  scope: 'global' | 'route',
): OutpostTreeNode => {
  const priority = outpost.priority ?? DEFAULT_NAVIGATION_OUTPOST_PRIORITY;
  const hooks = outpost.hooks ?? [NavigationHooks.BEFORE_EACH];

  return {
    id: `outpost-${scope}-${name}`,
    label: name,
    tags: [createPriorityTag(priority), createHooksTag(hooks)],
  };
};

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
      globalOutposts.push(createOutpostNode(name, outpost, 'global'));
    }
  }

  // Build route outposts (sorted by priority)
  for (const name of registry.routeSorted) {
    const outpost = registry.route.get(name);
    if (outpost) {
      routeOutposts.push(createOutpostNode(name, outpost, 'route'));
    }
  }

  return [
    {
      id: INSPECTOR_NODE_IDS.ROOT,
      label: 'Navigation Citadel',
      children: [
        {
          id: INSPECTOR_NODE_IDS.GLOBAL_GROUP,
          label: `Global Outposts (${globalOutposts.length})`,
          tags: [
            {
              label: 'global',
              textColor: TAG_COLORS.SCOPE_GLOBAL.text,
              backgroundColor: TAG_COLORS.SCOPE_GLOBAL.bg,
            },
          ],
          children: globalOutposts,
        },
        {
          id: INSPECTOR_NODE_IDS.ROUTE_GROUP,
          label: `Route Outposts (${routeOutposts.length})`,
          tags: [
            {
              label: 'route',
              textColor: TAG_COLORS.SCOPE_ROUTE.text,
              backgroundColor: TAG_COLORS.SCOPE_ROUTE.bg,
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
  const outpostMatch = nodeId.match(/^outpost-(global|route)-(.+)$/);
  if (!outpostMatch) {
    return null;
  }

  const [, scope, name] = outpostMatch;
  const map = scope === 'global' ? registry.global : registry.route;
  const outpost = map.get(name);

  if (!outpost) {
    return null;
  }

  const priority = outpost.priority ?? DEFAULT_NAVIGATION_OUTPOST_PRIORITY;
  const hooks = outpost.hooks ?? [NavigationHooks.BEFORE_EACH];

  return {
    'Outpost Details': [
      {
        key: 'name',
        value: name,
      },
      {
        key: 'scope',
        value: scope,
      },
      {
        key: 'priority',
        value: priority,
      },
      {
        key: 'hooks',
        value: hooks,
      },
      {
        key: 'timeout',
        value: outpost.timeout ?? 'none (uses default)',
      },
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
  // Add custom inspector
  api.addInspector({
    id: DEVTOOLS_CONFIG.INSPECTOR_ID,
    label: DEVTOOLS_CONFIG.INSPECTOR_LABEL,
    icon: DEVTOOLS_CONFIG.INSPECTOR_ICON,
  });

  // Handle tree requests
  api.on.getInspectorTree((payload) => {
    if (payload.inspectorId !== DEVTOOLS_CONFIG.INSPECTOR_ID) {
      return;
    }

    payload.rootNodes = createInspectorTree(registry);
  });

  // Handle state requests
  api.on.getInspectorState((payload) => {
    if (payload.inspectorId !== DEVTOOLS_CONFIG.INSPECTOR_ID) {
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
  api.sendInspectorTree(DEVTOOLS_CONFIG.INSPECTOR_ID);
  api.sendInspectorState(DEVTOOLS_CONFIG.INSPECTOR_ID);
};
