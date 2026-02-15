import { NavigationOutpostScopes } from '../types';

/**
 * DevTools plugin configuration
 */

export const DEVTOOLS_PLUGIN_ID = 'navigation.citadel';
export const DEVTOOLS_PLUGIN_LABEL = 'Navigation Citadel';
export const DEVTOOLS_PLUGIN_ICON = 'castle';
export const DEVTOOLS_PLUGIN_LOGO =
  'https://kassaila.github.io/vue-router-citadel/logo_devtools.svg';
export const DEVTOOLS_INSPECTOR_ID = DEVTOOLS_PLUGIN_ID + '.inspector';

/**
 * DevTools inspector node IDs
 */
export const INSPECTOR_NODE_ID_ROOT = 'citadel-root';
export const INSPECTOR_NODE_ID_GLOBAL = 'citadel-' + NavigationOutpostScopes.GLOBAL;
export const INSPECTOR_NODE_ID_ROUTE = 'citadel-' + NavigationOutpostScopes.ROUTE;

/**
 * Tag colors for DevTools inspector (hex format for devtools-kit)
 */
export const TAG_COLOR_TEXT = 0xffffff;
/**
 * Vue green
 */
export const TAG_COLOR_PRIORITY_BG = 0x42b983;
/**
 * Blue
 */
export const TAG_COLOR_HOOKS_BG = 0x3b82f6;
/**
 * Purple
 */
export const TAG_COLOR_SCOPE_GLOBAL_BG = 0x8b5cf6;
/**
 * Amber
 */
export const TAG_COLOR_SCOPE_ROUTE_BG = 0xf59e0b;
/**
 * Pink
 */
export const TAG_COLOR_LAZY_BG = 0xec4899;

/**
 * LocalStorage keys for DevTools settings
 */
export const SETTINGS_STORAGE_PREFIX = 'vue-router-citadel:settings:';
export const SETTINGS_KEY_LOG_LEVEL = 'logLevel';
