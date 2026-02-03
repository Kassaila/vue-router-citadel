import type { CustomInspectorNode, CustomInspectorState } from '@vue/devtools-kit';

/**
 * DevTools API type
 * Using 'any' to avoid type conflicts between @vue/devtools-api and @vue/devtools-kit
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DevToolsApi = any;

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

/**
 * Runtime state that can be modified via DevTools
 */
export interface CitadelRuntimeState {
  /**
   * Enable logging for non-critical events
   */
  log: boolean;
  /**
   * Enable debug mode (logging + debugger breakpoints)
   */
  debug: boolean;
}

/**
 * Log level values for DevTools settings
 */
export const LOG_LEVELS = {
  OFF: 'off',
  LOG: 'log',
  DEBUG: 'debug',
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

/**
 * DevTools settings definition for setupDevToolsPlugin
 * Uses index signature to be compatible with Record<string, PluginSettingsItem>
 */
export interface DevToolsSettingsDefinition {
  [key: string]: {
    label: string;
    type: 'choice';
    defaultValue: string;
    options: Array<{ label: string; value: string }>;
    component: 'button-group';
  };
}
