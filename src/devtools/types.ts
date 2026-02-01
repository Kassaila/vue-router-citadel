import type {
  CustomInspectorNode,
  CustomInspectorState,
  PluginDescriptor,
  PluginSetupFunction,
} from '@vue/devtools-kit';

/**
 * DevTools API type from @vue/devtools-kit
 */
export type DevToolsApi = Parameters<PluginSetupFunction>[0];

/**
 * Re-export types from devtools-kit for internal use
 */
export type { CustomInspectorNode, CustomInspectorState, PluginDescriptor };

/**
 * DevTools inspector node IDs
 */
export const INSPECTOR_NODE_IDS = {
  ROOT: 'citadel-root',
  GLOBAL_GROUP: 'citadel-global',
  ROUTE_GROUP: 'citadel-route',
} as const;

export type InspectorNodeId = (typeof INSPECTOR_NODE_IDS)[keyof typeof INSPECTOR_NODE_IDS];

/**
 * DevTools plugin configuration
 */
export const DEVTOOLS_CONFIG = {
  PLUGIN_ID: 'vue-router-citadel',
  PLUGIN_LABEL: 'Navigation Citadel',
  INSPECTOR_ID: 'vue-router-citadel-inspector',
  INSPECTOR_LABEL: 'Navigation Citadel',
  INSPECTOR_ICON: 'castle',
} as const;

/**
 * Outpost node for DevTools inspector tree
 */
export interface OutpostTreeNode extends CustomInspectorNode {
  id: string;
  label: string;
  tags: Array<{
    label: string;
    textColor: number;
    backgroundColor: number;
  }>;
  children?: OutpostTreeNode[];
}

/**
 * State data for a selected outpost in DevTools
 */
export interface OutpostStateData {
  name: string;
  scope: 'global' | 'route';
  priority: number;
  hooks: string[];
  timeout: number | undefined;
}

/**
 * DevTools state format for outpost
 */
export type OutpostInspectorState = CustomInspectorState;
