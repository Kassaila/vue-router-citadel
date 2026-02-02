import type {
  CustomInspectorNode,
  CustomInspectorState,
  PluginSetupFunction,
} from '@vue/devtools-kit';

/**
 * DevTools API type from @vue/devtools-kit
 */
export type DevToolsApi = Parameters<PluginSetupFunction>[0];

/**
 * Re-export types from devtools-kit for internal use
 */
export type { CustomInspectorNode, CustomInspectorState };

/**
 * Outpost node for DevTools inspector tree
 */
export interface OutpostTreeNode extends CustomInspectorNode {
  children?: OutpostTreeNode[];
}
